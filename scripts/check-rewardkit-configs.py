"""Load every shipped rubric with the verifier's actual RewardKit, without model calls."""
import copy
import tomllib
from pathlib import Path
from rewardkit.models import JudgeTomlConfig
from rewardkit.runner import _build_judge_reward

root = Path(__file__).resolve().parents[1]
paths = [root / 'scripts/task-support/semantic.toml', *sorted(root.glob('tasks/*/tests/semantic.toml'))]
expected = {'business-meaning', 'prohibited-actions', 'faithfulness'}
for path in paths:
    data = tomllib.loads(path.read_text())
    config = JudgeTomlConfig.model_validate(data)
    assert {c.name for c in config.criterion} == expected, path
    assert len(config.criterion) == len(expected), path
    _build_judge_reward(path, config, path.parent, path.parent)

# Reproduce the production failure: ids do not set the names used for uniqueness.
broken = copy.deepcopy(tomllib.loads(paths[0].read_text()))
for criterion in broken['criterion']:
    criterion.pop('name')
try:
    _build_judge_reward(paths[0], JudgeTomlConfig.model_validate(broken), paths[0].parent, paths[0].parent)
except ValueError as error:
    assert 'Duplicate criterion name' in str(error), error
else:
    raise AssertionError('The original duplicate-name regression was not detected')
print(f'{len(paths)} RewardKit rubrics loaded; original duplicate-name regression rejected; no model calls')
