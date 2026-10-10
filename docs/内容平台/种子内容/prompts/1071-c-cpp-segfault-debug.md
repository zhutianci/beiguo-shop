---
title: C / C++ 段错误怎么排查提示词（Segmentation fault 定位：gdb 回溯、AddressSanitizer、core dump）
slug: c-cpp-segfault-debug
model: any-llm
topics: [coding]
needsRefImage: false
useCase: C 或 C++ 程序崩溃报段错误（Segmentation fault）、结果偶尔错乱、或者在不同机器上表现不一样时用：AI 指导你用编译选项和调试工具拿到崩溃现场，分析 gdb 回溯和 AddressSanitizer 报告，找出空指针、越界、释放后使用、重复释放等根因。
prompt: |
  你是一名经验丰富的 C / C++ 工程师，擅长定位内存错误。请帮我排查下面的崩溃。

  - 语言与标准：[语言与标准]（例：C++17）
  - 编译器与系统：[编译器与系统]（例：GCC 13 + Ubuntu 24.04）
  - 构建方式：[构建方式]（例：CMake，Release 模式）
  - 现象：[现象]（例：处理大文件时偶尔段错误）
  - 已有的信息（崩溃时的输出、gdb 回溯、AddressSanitizer 报告，原样粘贴）：
    [粘贴信息]
  - 相关代码：
    [粘贴代码]

  请按以下步骤：
  1. 如果还没有足够的信息，先告诉我如何拿到崩溃现场：
     - 带调试信息、关闭优化重新编译的选项；
     - 开启 AddressSanitizer 与未定义行为检测的编译和链接选项，以及它们对性能的影响；
     - 用 gdb 运行或分析 core dump 的命令（包括如何开启 core dump、查看回溯、切换栈帧、打印变量）；
     - 在 macOS 上对应的工具和方法。
  2. 分析我提供的回溯或报告：
     - 指出崩溃发生在哪个函数、哪一行，是谁调用的；
     - AddressSanitizer 报告中，解释错误类型（堆越界、栈越界、释放后使用、重复释放、内存泄漏），以及报告中「分配位置」「释放位置」两段各说明了什么。
  3. 对照代码找根因，常见方向：空指针或未初始化的指针、数组或容器越界、迭代器失效（遍历时修改容器）、返回局部变量的地址或引用、对象生命周期结束后仍在使用、多线程竞态、格式化字符串与参数不匹配、有符号与无符号比较导致的越界。
  4. 给出修复方案和修改后的代码；C++ 中优先用标准库容器、智能指针、带边界检查的访问方式等更安全的写法。
  5. 说明为什么这个问题在 Release 模式或某些机器上才出现（未定义行为的表现不确定）。
  6. 建议加入哪些测试或检查，防止同类问题再次出现。
negativePrompt: null
source: null
verify:
  - 用一段「vector 遍历中 push_back 导致迭代器失效」的代码在 -fsanitize=address 下运行，检查 AI 对报告的解读是否正确
---
**怎么填变量**：[已有的信息] 里最有价值的是 AddressSanitizer 报告，它通常能直接指出出错的行、内存是在哪里分配和释放的。还没有这些信息时，先让 AI 告诉你怎么编译和运行。[构建方式] 写清 Debug 还是 Release，优化级别会影响问题是否出现。

**常见坑**：
- 在 Release 模式下调试，变量被优化掉、行号对不上。复现时先用调试信息加低优化级别编译。
- 加几行打印语句后问题「消失」了，不代表修好了。未定义行为的表现会随内存布局变化，用工具检测才可靠。
- C++ 中遍历容器的同时增删元素，迭代器可能失效。这类问题在小数据量时往往不出错，数据一多就崩溃。

**追问技巧**：修复后追问「项目中还有哪些地方可能有同样的模式，给我一个搜索的关键字或正则」，顺藤摸瓜一次修完。

### 示例输出

> 示例，仅供参考（AddressSanitizer 报告解读，节选）

```
ERROR: AddressSanitizer: heap-use-after-free on address 0x6020000000f0
READ of size 4 at 0x6020000000f0 thread T0
    #0 in process(std::vector<int>&) src/main.cpp:14
freed by thread T0 here:
    #3 in std::vector<int>::push_back(int const&)
    #4 in process(std::vector<int>&) src/main.cpp:16
```

**解读**：第 14 行读取的内存，已经在第 16 行 `push_back` 时被释放——容器扩容后旧的内存被释放，而循环中的迭代器仍指向旧内存。

```bash
g++ -std=c++17 -g -O1 -fsanitize=address,undefined -fno-omit-frame-pointer main.cpp -o app
./app input.txt
```

**修复**：遍历时不修改容器，先把要添加的元素放到临时容器，循环结束后再插入。
