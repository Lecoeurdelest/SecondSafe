const fs = require('fs');
const path = require('path');
const root = '/Users/quyn28654/Documents/ChatGPT/wdp/SecondSafe';
const parser = require(path.join(root, 'backend/node_modules/@babel/parser'));
const result = { analyzer: '@babel/parser', version: require(path.join(root, 'backend/node_modules/@babel/parser/package.json')).version, limitation: 'AST-derived branch/call/data-flow inventory for manual review; no calibrated confidence or complete formal semantics claimed', files: [] };
for (const name of ['utils/jwt.util.js', 'middlewares/auth.middleware.js', 'middlewares/role.middleware.js', 'middlewares/admin.middleware.js']) {
  const file = `backend/src/common/${name}`;
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = parser.parse(source, { sourceType: 'script' });
  const entry = { file, functions: [] };
  const code = node => node ? source.slice(node.start, node.end) : null;
  function inspect(node, current) {
    if (!node || typeof node !== 'object') return;
    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) {
      current = { name: node.id?.name || `anonymous@${node.loc.start.line}`, line: node.loc.start.line, parameters: node.params.map(code), branches: [], bindings: [], assignments: [], awaits: [], returns: [], throws: [], calls: [] };
      entry.functions.push(current);
    }
    if (current) {
      if (node.type === 'IfStatement') current.branches.push({ test: code(node.test), line: node.loc.start.line, then: node.consequent.type, else: node.alternate?.type || null });
      if (node.type === 'ConditionalExpression') current.branches.push({ test: code(node.test), then: code(node.consequent), else: code(node.alternate) });
      if (node.type === 'VariableDeclarator') current.bindings.push({ target: code(node.id), source: code(node.init) });
      if (node.type === 'AssignmentExpression') current.assignments.push({ target: code(node.left), source: code(node.right) });
      if (node.type === 'AwaitExpression') current.awaits.push(code(node.argument));
      if (node.type === 'ReturnStatement') current.returns.push(code(node.argument));
      if (node.type === 'ThrowStatement') current.throws.push(code(node.argument));
      if (node.type === 'CallExpression') current.calls.push(code(node.callee));
      if (node.type === 'TryStatement') current.branches.push({ exception_edge: Boolean(node.handler), finally: Boolean(node.finalizer), line: node.loc.start.line });
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'start', 'end', 'extra'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(child => inspect(child, current));
      else if (value && typeof value === 'object') inspect(value, current);
    }
  }
  inspect(ast, null);
  result.files.push(entry);
}
fs.writeFileSync(path.join(root, '.project/evidence/TASK-005/run-01/ast-flow.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`AST-derived branch/call/data-flow inventory: ${result.files.length} source files; manual review required`);
