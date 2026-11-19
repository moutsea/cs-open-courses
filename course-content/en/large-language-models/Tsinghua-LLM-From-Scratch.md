# Tsinghua IIIS: Large Language Models from Scratch

## Course Overview

- University: Tsinghua University
- Prerequisites: No formal prerequisites are listed. You should be comfortable with Python and PyTorch, deep learning, and linear algebra; the assignments also use CUDA and Triton.
- Programming Language: Python, PyTorch, CUDA, Triton
- Course Difficulty: 🌟🌟🌟🌟🌟
- Estimated Study Hours: 180 hours

This Fall 2025 course takes the “build it yourself” route through large language models. The lectures begin with GPU programming and GPU-friendly architecture design, then move through attention variants, hyperparameter tuning and scaling laws, optimizers, and data curation. The final sessions look at how the Qwen models are built and how post-training systems are designed, so the course connects the mathematics of training with the engineering that makes a large run possible.

The four assignments carry most of the workload: write Transformer inference code and load Qwen3 weights, implement Triton kernels including Flash Attention, pretrain a 100M-parameter model on FineWeb-Edu, and scale the pipeline to a 0.6B model with supervised fine-tuning. A group project accounts for 40% of the grade. The course site names Stanford CS336 as its primary inspiration, but the GPU, scaling, and Qwen-specific material is developed for this course.

## Course Resources

- Course Website: <https://kaifeng.ac/llms-from-scratch/2025/>
- Latest Offering: <https://kaifeng.ac/llms-from-scratch/2026/>
- Assignments: <https://github.com/vfleaking/llms-from-scratch-fall-2025-assignment>
