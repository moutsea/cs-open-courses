# 深度生成模型学习路线

近几年大语言模型成为大热的方向，也和笔者博士期间的课题非常相关。这篇路线图旨在分享笔者在熟悉和深入深度生成模型这一领域过程中学习和参考的各类课程资料，方便相关领域的从业者或者对生成模型的底层原理感兴趣的朋友共同学习。由于笔者科研之余时间有限，很多课程的实验并未完成，等后续有时间完成之后会在该目录下一一添加。

其实，大语言模型只是深度生成模型的一个分支，而其他生成模型例如 VAE，GAN，Diffusion Model，Flow 等等，都还在“生成”这一领域占有重要地位，所谓的 AIGC，就是泛指这一类技术。
推荐学习下列课程：

- [MIT 6.S184: Generative AI with Stochastic Differential Equations](./MIT6.S184.md): MIT IAP 小学期的 GenAI 入门课程，主要通过微分方程的视角讲解了 Flow Matching 和 Diffusion Model 背后的数学原理，并且配有简单的小实验让学生在实践中理解，适合对底层数学原理感兴趣的同学入门。

- [MIT 6.S978: Deep Generative Models](./MIT6.S978.md)：研究生级别的生成模型研讨课，覆盖变分、自回归、对抗和扩散模型，并包含论文报告与期末项目。

- [UCB CS294-158-SP24: Deep Unsupervised Learning](./CS294-158.md)：涵盖生成模型和自监督学习，作业要求学生自己实现并训练模型，适合想通过实践掌握生成模型细节的学习者。

- [CMU 10423: Generative AI](./CMU10423.md)：覆盖文本、代码、图像、Transformer、扩散模型、多模态生成，以及大规模训练中的工程问题。


OpenAI 的 GPT 系列让大语言模型在 Scaling Law 的指引下展现出惊人的效果，在数学和代码领域取得了很大进展。如果你主要关注大语言模型这个方向，那么推荐如下课程：

- [Stanford CS336: Language Modeling from Scratch](./large-language-models/CS336.md)：从零实现 LLM 的核心组件，包括数据清洗、Tokenizer、Transformer、训练、评估和后训练。

- [Stanford CS224G：构建和扩展大语言模型应用](./large-language-models/CS224G.md)：通过项目学习 RAG、上下文工程、Agent、评测、部署、可观测性和产品迭代。

- [Hugging Face LLM Course](./large-language-models/HuggingFace-LLM-Course.md)：使用 Transformers、Datasets、Tokenizers、Accelerate 和 Hugging Face Hub 的实战课程。

- [Full Stack Deep Learning：LLM Bootcamp](./large-language-models/Full-Stack-Deep-Learning.md)：覆盖模型选择、Prompt 和工具调用、LLMOps、评估、部署、监控和用户体验。

- [Stanford CS324：大语言模型](./large-language-models/CS324.md)：系统梳理 LLM 的建模、理论、系统、应用、伦理和社会影响。

- [CMU 11-868：Large Language Model Systems](./large-language-models/CMU11-868.md)：侧重 GPU 加速、分布式训练与推理、模型压缩、服务部署和大语言模型的系统级优化。

- [CMU 11-667：Large Language Models: Methods and Applications](./large-language-models/CMU11-667.md) 和 [CMU 11-711：Advanced NLP](./large-language-models/CMU11-711.md)：更偏重上层算法、应用、论文阅读和大语言模型研究前沿。

除了课程以外，还有很多不错的资料作为参考：

- [Awesome-LLM](https://github.com/Hannibal046/Awesome-LLM): 大语言模型相关资料汇总
- [LLMSys-PaperList](https://github.com/AmberLJC/LLMSys-PaperList): 大语言模型系统相关论文汇总
- [MLsys-Guide](https://github.com/PKU-DAIR/Starter-Guide/blob/main/docs/systems/Readme.md): 深度学习系统入门指南
