import { memo } from 'react';

interface LearningPathFlowProps {
  steps: Array<{
    title: string;
  }>;
}

const LearningPathFlow = memo(function LearningPathFlow({ steps }: LearningPathFlowProps) {

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2 rounded-lg font-medium text-sm">
            {step.title}
          </div>
          {index < steps.length - 1 && (
            <div className="text-gray-400 mx-1">→</div>
          )}
        </div>
      ))}
    </div>
  );
});

export default LearningPathFlow;