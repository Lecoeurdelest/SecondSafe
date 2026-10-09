import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('gitflow', Path(__file__).with_name('check-gitflow.py'))
gitflow = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gitflow)
FEATURE = 'codex/feature/task-053-gitflow-checks'
OTHER = 'codex/feature/task-054-web-assets'


class RouteTests(unittest.TestCase):
    def test_allowed_integration_routes(self):
        for head, base in [(FEATURE, 'develop'), ('codex/release/1.0.0', 'main'),
                           ('codex/release/1.0.0', 'develop'), ('codex/hotfix/login', 'main'),
                           ('codex/hotfix/login', 'develop'), ('main', 'develop')]:
            with self.subTest(head=head, base=base):
                gitflow.validate_route(head, base)

    def test_invalid_routes(self):
        for head, base in [(FEATURE, 'main'), ('develop', 'main'), ('main', 'main'),
                           ('feature/task-053-test', 'develop'), ('codex/release/', 'main'),
                           ('codex/hotfix/', 'main'), (FEATURE, 'random'), (FEATURE, FEATURE)]:
            with self.subTest(head=head, base=base):
                with self.assertRaises(ValueError):
                    gitflow.validate_route(head, base, allow_stacked=True)

    def test_stacks_require_explicit_permission(self):
        with self.assertRaises(ValueError):
            gitflow.validate_route(FEATURE, OTHER)
        gitflow.validate_route(FEATURE, OTHER, allow_stacked=True)

    def test_task_subject_scope(self):
        gitflow.validate_subject('Enforce Gitflow (TASK-053)', FEATURE)
        for subject in ('', 'Fix checks', 'Fix checks (TASK-054)', 'TASK-053 and TASK-054'):
            with self.subTest(subject=subject):
                with self.assertRaises(ValueError):
                    gitflow.validate_subject(subject, FEATURE)


class HookTests(unittest.TestCase):
    def test_installed_hooks_block_invalid_commits_and_preserve_existing_hooks(self):
        root = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory() as directory:
            def run(*args, check=True):
                return subprocess.run(args, cwd=directory, text=True, capture_output=True, check=check)
            run('git', 'init', '-b', 'main')
            run('git', 'config', 'user.name', 'Lecoeurdelest')
            run('git', 'config', 'user.email', '116455158+Lecoeurdelest@users.noreply.github.com')
            run('python3', str(root / 'tools/pdd/install-gitflow-hooks.py'))
            blocked = run('git', 'commit', '--allow-empty', '-m', 'Direct stable commit', check=False)
            self.assertNotEqual(blocked.returncode, 0)
            run('git', 'switch', '-c', FEATURE)
            blocked = run('git', 'commit', '--allow-empty', '-m', 'Wrong task (TASK-054)', check=False)
            self.assertNotEqual(blocked.returncode, 0)
            run('git', 'commit', '--allow-empty', '-m', 'Valid task (TASK-053)')
            blocked = run('git', 'commit', '--allow-empty', '--author', 'Other <other@example.com>',
                          '-m', 'Wrong author override (TASK-053)', check=False)
            self.assertNotEqual(blocked.returncode, 0)
            run('git', 'switch', '--detach')
            blocked = run('git', 'commit', '--allow-empty', '-m', 'Detached commit (TASK-053)', check=False)
            self.assertNotEqual(blocked.returncode, 0)
            run('git', 'switch', FEATURE)
            base = run('git', 'rev-parse', 'HEAD').stdout.strip()
            run('git', 'commit', '--allow-empty', '-m', 'Follow-up (TASK-053)')
            command = ('python3', str(root / 'tools/pdd/check-gitflow.py'), '--head-branch', FEATURE,
                       '--base-branch', 'develop', '--base', base)
            run(*command)
            run('git', 'commit', '--allow-empty', '--no-verify', '-m', 'Mixed scope (TASK-054)')
            self.assertNotEqual(run(*command, check=False).returncode, 0)
            run('git', 'config', 'user.email', 'other@example.com')
            blocked = run('git', 'commit', '--allow-empty', '-m', 'Wrong author (TASK-053)', check=False)
            self.assertNotEqual(blocked.returncode, 0)
            run('git', 'config', 'core.hooksPath', '/existing/custom/hooks')
            blocked = run('python3', str(root / 'tools/pdd/install-gitflow-hooks.py'), check=False)
            self.assertNotEqual(blocked.returncode, 0)
            self.assertEqual(run('git', 'config', '--get', 'core.hooksPath').stdout.strip(),
                             '/existing/custom/hooks')


if __name__ == '__main__':
    unittest.main()
