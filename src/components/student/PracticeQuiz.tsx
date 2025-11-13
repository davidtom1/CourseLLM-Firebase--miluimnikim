'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { TOPICS, QUIZ_QUESTIONS } from '@/lib/data';
import type { QuizQuestion } from '@/lib/types';
import { generatePracticeQuiz } from '@/ai/flows/generate-practice-quiz';

type QuizState = 'initial' | 'loading' | 'active' | 'submitted';

export function PracticeQuiz() {
  const [quizState, setQuizState] = useState<QuizState>('initial');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const handleGenerateQuiz = async () => {
    if (!selectedTopic) return;
    setQuizState('loading');
    
    // This is a mock. In a real app, the AI would generate questions.
    // We can still call the flow to simulate the process.
    try {
        await generatePracticeQuiz({ topic: selectedTopic });
    } catch (e) {
        console.error("AI flow for quiz generation failed, using mock data.", e);
    }

    setTimeout(() => {
      setQuestions(QUIZ_QUESTIONS);
      setQuizState('active');
    }, 1000);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    let correctAnswers = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctAnswers++;
      }
    });
    setScore((correctAnswers / questions.length) * 100);
    setQuizState('submitted');
  };
  
  const resetQuiz = () => {
    setQuizState('initial');
    setSelectedTopic(null);
    setQuestions([]);
    setAnswers({});
    setScore(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Quiz</CardTitle>
        <CardDescription>Test your understanding of course topics.</CardDescription>
      </CardHeader>
      <CardContent>
        {quizState === 'initial' && (
          <div className="space-y-4 max-w-sm mx-auto text-center">
            <p>Select a topic to generate a short practice quiz.</p>
            <Select onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((topic) => (
                  <SelectItem key={topic.id} value={topic.name}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateQuiz} disabled={!selectedTopic}>
              Generate Quiz
            </Button>
          </div>
        )}

        {quizState === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4 h-48">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating your quiz...</p>
            </div>
        )}

        {quizState === 'active' && (
          <div className="space-y-8">
            {questions.map((q, index) => (
              <div key={q.id}>
                <p className="font-semibold mb-4">
                  {index + 1}. {q.question}
                </p>
                <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)}>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                        <Label htmlFor={`${q.id}-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            ))}
            <Button onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length}>
              Submit Quiz
            </Button>
          </div>
        )}

        {(quizState === 'submitted' && score !== null) && (
            <div className="space-y-6">
                <Alert variant={score > 70 ? 'default' : 'destructive'} className="bg-opacity-20">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Quiz Submitted!</AlertTitle>
                    <AlertDescription className="text-lg font-bold">
                        Your score: {score.toFixed(0)}%
                    </AlertDescription>
                </Alert>
                <div className="space-y-4">
                    {questions.map(q => (
                        <div key={q.id} className="p-4 border rounded-lg">
                            <p className="font-semibold">{q.question}</p>
                            <div className="mt-2 text-sm space-y-1">
                                <p className={answers[q.id] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}>
                                    Your answer: {answers[q.id]} {answers[q.id] === q.correctAnswer ? <CheckCircle2 className="inline h-4 w-4 ml-1"/> : <XCircle className="inline h-4 w-4 ml-1" />}
                                </p>
                                {answers[q.id] !== q.correctAnswer && <p className="text-green-700">Correct answer: {q.correctAnswer}</p>}
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={resetQuiz}>Take another quiz</Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
