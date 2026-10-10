---
title: pgvector 是什么、怎么安装和使用：在 PostgreSQL 里存向量、查最近邻、建索引
slug: pgvector-postgres-vector-install-usage
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: pgvector 是什么、怎么安装使用？按官方 README 讲清它给 PostgreSQL 加了什么、源码与 Docker 两种安装方式、四条 SQL 完成建表插入查询、六个距离运算符的含义、HNSW 与 IVFFlat 两种索引怎么选怎么调，以及 2000 维的索引上限怎么绕过。
checkedOn: 2026-10-11
sources:
  - https://github.com/pgvector/pgvector
verify:
  - 安装命令里的版本标签 v0.8.7 和 Docker 镜像标签 pg18-trixie 为官方 README 在 2026-10-11 所写，安装时以 README 当前内容为准
  - 各云厂商的托管 PostgreSQL 是否预装 pgvector、版本是多少，以各厂商文档为准
  - Windows 的编译步骤本文只做了概述，完整命令见官方 README
---

> 本文根据 pgvector 官方仓库 README 整理，资料核对于 2026-10-11。文中命令和 SQL 取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「pgvector 是什么」「pgvector 安装」「pgvector 教程」「pgvector docker」的人；
- 业务数据已经在 PostgreSQL 里，做 RAG 或语义搜索时不想再多维护一个向量数据库的人；
- 用上了 pgvector，但数据一多查询就变慢，不知道索引该怎么建的人。

## 结论先说

1. **pgvector 是 PostgreSQL 的一个开源扩展**，给它加上向量相似度搜索，向量可以和其他业务数据存在同一个库、同一张表里。
2. **支持 PostgreSQL 13 及以上**。
3. **用法就是 SQL**：`CREATE EXTENSION vector;` 之后，多了一个 `vector` 列类型和几个距离运算符。
4. **不建索引时是精确搜索**，结果完全准确但数据多了会慢；建了近似索引会更快，代价是召回率略降。
5. **索引首选 HNSW**。官方的评价是它在速度和召回率之间的平衡更好，代价是建索引更慢、更占内存。
6. **`vector` 类型最多能给 2,000 维建索引**。维度更高的嵌入要用半精度或二值量化。

## 一、它提供了什么

- 精确和近似的最近邻搜索；
- 四种向量类型：单精度 `vector`、半精度 `halfvec`、二值 `bit`、稀疏 `sparsevec`；
- 六种距离：L2、内积、余弦、L1、汉明、杰卡德。

因为它就在 PostgreSQL 里，事务、备份、权限、关联查询这些能力照常可用。比如「只在当前用户有权限看的文档里做语义搜索」，就是一条带 `WHERE` 的普通 SQL。

## 二、安装

**Linux 和 Mac（从源码编译）**

```sh
cd /tmp
git clone --branch v0.8.7 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install # may need sudo
```

**Docker**

```sh
docker pull pgvector/pgvector:pg18-trixie
```

镜像里是已经装好 pgvector 的 PostgreSQL，本地试用最省事。

**Windows**：官方的做法是在 Visual Studio 里安装 C++ 支持，以管理员身份打开「x64 Native Tools Command Prompt for VS」，设置 `PGROOT` 为 PostgreSQL 的安装路径，克隆同一个版本标签后用 `nmake /F Makefile.win` 编译并安装。完整命令见 README。

**其他方式**：README 还列了 Homebrew、PGXN、APT、Yum、conda-forge 等包管理器；许多托管的 PostgreSQL 服务也已经提供这个扩展，用云数据库的先查一下厂商文档，往往不需要自己安装。

## 三、四条 SQL 上手

```sql
CREATE EXTENSION vector;
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

1. 在当前数据库里启用扩展（每个要用它的数据库执行一次）；
2. 建一张带向量列的表，`vector(3)` 表示 3 维。实际使用时括号里是嵌入模型的输出维度；
3. 插入向量，写法是方括号包住、逗号分隔的字符串；
4. 按 L2 距离找出离 `[3,1,2]` 最近的 5 条。

实际的表通常还有原文、来源等列，向量列只是其中一列。

## 四、六个距离运算符

| 运算符 | 含义 |
| --- | --- |
| `<->` | L2 距离（欧氏距离） |
| `<#>` | 负内积 |
| `<=>` | 余弦距离 |
| `<+>` | L1 距离（曼哈顿距离） |
| `<~>` | 汉明距离（二值向量） |
| `<%>` | 杰卡德距离（二值向量） |

两点说明：

- `<#>` 返回的是**负**内积，所以同样是 `ORDER BY ... LIMIT` 取最小值，得到的是内积最大的；
- 用哪种距离，看嵌入模型的文档建议。文本嵌入最常用的是余弦距离。**建索引时选的运算符类要和查询时用的距离一致**，否则索引用不上。

## 五、建索引：HNSW 还是 IVFFlat

**HNSW**

```sql
CREATE INDEX ON items USING hnsw (embedding vector_l2_ops);
```

- 官方评价：速度与召回率的平衡更好，但建索引更慢、占用内存更多；
- 建索引时的两个参数：`m`（默认 16）和 `ef_construction`（默认 64），写法是 `WITH (m = 16, ef_construction = 64)`；
- 查询时的参数 `hnsw.ef_search` 默认 40，调大可以提高召回率，代价是变慢。

**IVFFlat**

```sql
CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
```

- 官方评价：建索引更快、占内存更少，但查询性能较低；
- **要在表里有了数据之后再建**；
- `lists` 的取值建议：100 万行以内用「行数 / 1000」，超过 100 万行用「行数的平方根」；
- 查询时的 `ivfflat.probes` 从「lists 的平方根」起步，调大提高召回率、降低速度。

怎么选：

| 情况 | 建议 |
| --- | --- |
| 数据量小（几千到几万行） | 可以先不建索引，精确搜索就够快，而且结果完全准确 |
| 一般情况 | HNSW |
| 内存紧张，或者需要很快建完索引 | IVFFlat |

示例里的 `vector_l2_ops` 对应 L2 距离。用余弦距离查询时，建索引要换成对应余弦的运算符类，名称见 README 的索引一节。

## 六、维度上限

| 类型 | 最多可存储 | 最多可建索引 |
| --- | --- | --- |
| `vector` | 16,000 维 | 2,000 维 |
| `halfvec` | 16,000 维 | 4,000 维 |
| `bit` | | 64,000 维 |
| `sparsevec` | 16,000 个非零元素 | 1,000 个非零元素（HNSW） |

嵌入模型的输出超过 2,000 维时，README 给的办法：

- 用半精度向量或半精度索引，可以到 4,000 维；
- 用二值量化，可以到 64,000 维；
- 或者对子向量建索引、做降维。

有的嵌入模型支持指定较低的输出维度，在调用时直接取一个 2,000 以内的维度也是常见做法，以所用模型的文档为准。

## 七、混合搜索

README 说明 pgvector 可以和 PostgreSQL 自带的全文搜索配合使用，两路结果可以用 Reciprocal Rank Fusion（倒数排名融合）或交叉编码器合并。

用户的问题里有型号、编号、专有名词这类必须精确匹配的词时，只靠向量搜索容易漏，加上全文搜索会稳很多。

## 常见问题

**Q：一张表能存多少向量？**
README 的回答：非分区表默认最大 32 TB；分区表可以有成千上万个这样的分区。

**Q：建了索引，结果变少或者和之前不一样？**
近似索引本来就是用少量召回率换速度。调大 `hnsw.ef_search` 或 `ivfflat.probes` 可以提高召回率。

**Q：`CREATE EXTENSION vector` 报错说找不到扩展？**
说明扩展文件没有装到这个 PostgreSQL 实例上。自建的检查编译安装是否装到了正确的 PostgreSQL 版本；云数据库看厂商是否支持、是否要先在控制台开启。

**Q：和专门的向量数据库怎么选？**
已经在用 PostgreSQL、向量规模在单机能承受的范围内，pgvector 少一个系统、数据一致性也好处理。只是做原型看[《ChromaDB 是什么》](/guides/chromadb-vector-database-quickstart)；规模很大看[《Milvus Lite 使用教程》](/guides/milvus-lite-local-vector-database-quickstart)里对 Milvus 各形态的说明。

## 参考资料

- pgvector/pgvector（官方仓库与 README）：https://github.com/pgvector/pgvector
