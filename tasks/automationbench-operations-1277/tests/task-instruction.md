读Projects及全部Project Policy，选可启动Approved/High且Target Start最早的项目。原缺kickoff日期时刻，本适配固定Target Start当日10:00 UTC90分钟。创建cal_projects飞书视频日历Project Kickoff: <Name>并邀请PM Email；创建trello_cards(board=brd_projects/list=Active/name=原项目名)和飞书文档(父目录=pg_projects/title=原项目名/content含PM和UTC窗口)。真实新建飞书群，name为项目名小写空格改连字符，description为Project kickoff coordination；源无PM飞书user_id故不捏造成员，初始不传user_id_list。向新群发kickoff公告含原项目名、PM和时间，不能只登记建群台账。

本次业务处理以 2026-01-29T09:00:00Z 为时间基准。

文档必须通过飞书 Docs 创建，使用 Markdown 内容；不在 Base 表里登记页面来替代文档。本题将原目录映射为飞书云盘目录 pg_projects。 可用 docs +create / +fetch / +update，均指定 --doc-format markdown；云盘目录使用 drive files list 查询。
