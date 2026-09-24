# Documentation map

| Layer | Location | Authority |
|---|---|---|
| Intent | [../plan.md](../plan.md) | authored |
| Structured model | [../project.yaml](../project.yaml) | authored |
| Requirements (FR, NFR) | [requirements/](requirements/README.md) | generated from project.yaml |
| Task index and specifications | [task/](task/README.md) | generated from project.yaml + .project/state.json |
| Architecture | [technical/architecture.md](technical/architecture.md) | authored |
| Order lifecycle | [technical/order-lifecycle.md](technical/order-lifecycle.md) | authored |
| Data model | [technical/data-model.md](technical/data-model.md) | generated from the Mongoose schemas |
| Baseline and defect mapping | [technical/baseline-wdp.md](technical/baseline-wdp.md) | authored |
| Implementation records | [implement/](implement/) | authored, one per completed task |
| Evidence | [../.project/evidence/](../.project/evidence/) | original runner outputs |

Regenerate the generated views with `python3 tools/pdd/render.py`. Running `python3 tools/pdd/render.py --check` fails when any of them is stale.
