FROM lark-gym-mock:0.2.3
COPY seed.json /opt/mock/seed.json
COPY unsupported.ts unsupported-policy.json /opt/mock/
CMD ["--unsupported-hook", "/opt/mock/unsupported.ts", "--unsupported-policy", "/opt/mock/unsupported-policy.json", "--abort-signal", "/run/task-control/abort.json"]
