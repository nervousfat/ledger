# 备份与预算

exportBackup 生成 pocket-ledger v1 格式：

- 账目先排序去重，再连同预算一起序列化；
- 预算是非负整数分，超过上限会被拒绝；
- importBackup 会重新校验并规范化，损坏的文件直接报错。
