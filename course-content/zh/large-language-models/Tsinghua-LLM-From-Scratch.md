# 清华 IIIS：Large Language Models from Scratch

## 课程简介

- 所属大学：Tsinghua University
- 先修要求：未列出正式先修；需要熟悉 Python 与 PyTorch，具备深度学习和线性代数基础，作业还会用到 CUDA 与 Triton
- 编程语言：Python、PyTorch、CUDA、Triton
- 课程难度：🌟🌟🌟🌟🌟
- 预计学时：180 学时

这是 2025 年秋季开设的「从零实现大语言模型」课程。前半程先讲 GPU 编程与对 GPU 友好的架构设计，再进入注意力机制的各种变体、超参数调节与 scaling law、优化器和数据筛选；最后几讲拆解 Qwen 系列模型的构建方式与后训练系统，把训练的数学原理和真正跑起一次大模型所需的工程细节接在一起。

课程的主要工作量在四次编程作业：先自己写 Transformer 推理代码并加载 Qwen3 权重，再用 Triton 实现包括 Flash Attention 在内的若干 GPU kernel，接着在 FineWeb-Edu 上预训练一个 100M 参数模型，最后把流程扩展到 0.6B 模型并做监督微调。小组项目占总评 40%。课程网站明确说明以 Stanford CS336 为主要参考，但 GPU、scaling 与 Qwen 相关的内容是按本课重新组织的。

## 课程资源

- 课程网站：<https://kaifeng.ac/llms-from-scratch/2025/>
- 最新一期：<https://kaifeng.ac/llms-from-scratch/2026/>
- 课程作业：<https://github.com/vfleaking/llms-from-scratch-fall-2025-assignment>
