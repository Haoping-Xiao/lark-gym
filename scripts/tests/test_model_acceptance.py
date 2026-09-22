import importlib.util, json, tempfile, unittest
from pathlib import Path

def load(name):
    spec=importlib.util.spec_from_file_location(name, Path('scripts')/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

class AcceptanceTests(unittest.TestCase):
    def test_disjoint_full_configs(self):
        module=load('prepare-model-acceptance');seen=[]
        with tempfile.TemporaryDirectory() as d:
            for index in range(100):
                root=Path(d)/str(index);seen+=module.prepare('full',index,100,root)
                cfg=json.loads((root/'codex.yaml').read_text())
                self.assertEqual(cfg['agents'][0]['model_name'],'openai/gpt-6-astra')
                self.assertEqual(len(cfg['datasets'][0]['task_names']),8)
            self.assertEqual(len(seen),800);self.assertEqual(len(set(seen)),800)
    def test_excluded_not_counted_as_model_failure(self):
        module=load('summarize-model-acceptance')
        with tempfile.TemporaryDirectory() as d:
            job=Path(d);trial=job/'x';(trial/'artifacts/var/lib/feishu-mock').mkdir(parents=True)
            (trial/'verifier').mkdir()
            (trial/'result.json').write_text(json.dumps({'task_name':'lark-gym/t','exception_info':{'exception_type':'RewardFileNotFoundError'},'verifier_result':None}))
            (trial/'artifacts/var/lib/feishu-mock/state.json').write_text(json.dumps({'calls':[{'method':'GET','path':'/open-apis/unknown?a=1','status':501,'seq':1}]}))
            (trial/'verifier/result.json').write_text(json.dumps({'coverage':{'valid_sample':False}}))
            result=module.summarize(job,['t','missing'])
            self.assertEqual(result['counts'],{'environment_excluded':1})
            self.assertIsNone(result['valid_success_rate']);self.assertEqual(result['missing_tasks'],['missing'])
            self.assertEqual(result['endpoint_observations'][0]['path'],'/open-apis/unknown')
    def test_live_judge_error_never_passes(self):
        module=load('summarize-model-acceptance')
        with tempfile.TemporaryDirectory() as d:
            job=Path(d);trial=job/'x';(trial/'artifacts/var/lib/feishu-mock').mkdir(parents=True)
            (trial/'result.json').write_text(json.dumps({'task_name':'t','exception_info':{'exception_type':'VerifierError'},'verifier_result':None}))
            (trial/'artifacts/var/lib/feishu-mock/state.json').write_text('{"calls":[]}')
            result=module.summarize(job,['t']);self.assertEqual(result['counts'],{'execution_error':1})
            self.assertIsNone(result['valid_success_rate'])
    def test_split_report_controls_do_not_forge_write_history(self):
        module=load('judge-acceptance-fixtures')
        state={'seed':{'messages':[]},'world':{'messages':[{'message_id':'m','chat_id':'c','body':{'content':json.dumps({'text':'a\nb\nc\nd'})}}]},'calls':[{'changed':True},{'changed':False}]}
        variants=module.variants('automationbench-finance-4008',state,{})
        self.assertEqual([v[2] for v in variants],[1,0,0])
        self.assertEqual([len(v[1]['world']['messages']) for v in variants],[4,3,5])
        self.assertTrue(all(v[1]['calls']==[{'changed':False}] for v in variants))
        self.assertEqual(len(state['world']['messages']),1)

if __name__=='__main__':unittest.main()
