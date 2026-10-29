#!/usr/local/bin/python
"""RewardKit CLI with DeepSeek JSON-mode transport compatibility.

RewardKit still parses and validates every returned criterion locally. The
provider's JSON mode does not enforce the schema, so malformed output must fail
through the normal RewardKit error path rather than becoming a passing score.
"""
import json
import jsonschema
import litellm
from rewardkit.__main__ import main

_original_completion = litellm.acompletion


async def completion(**kwargs):
    schema = None
    if kwargs.get("model") == "deepseek/deepseek-v4-pro":
        if (kwargs.get("response_format") or {}).get("type") == "json_schema":
            schema = kwargs["response_format"]["json_schema"]["schema"]
            kwargs["response_format"] = {"type": "json_object"}
            kwargs["messages"] = [
                *kwargs.get("messages", []),
                {"role": "system", "content": "Return only JSON conforming to this schema. Its exact score enum overrides any earlier numeric example: " + json.dumps(schema)},
            ]
        kwargs.setdefault("max_tokens", 4096)
    response = await _original_completion(**kwargs)
    if schema is not None:
        jsonschema.validate(json.loads(response.choices[0].message.content), schema)
    return response


litellm.acompletion = completion

if __name__ == "__main__":
    main()
