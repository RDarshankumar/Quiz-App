import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import data from "../questions.json"; // Ensure your JSON file is in the correct path

// Shuffle function to randomize options
const shuffleArray = (array) => {
  let newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const QuizApp = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(true);
  const [userAnswers, setUserAnswers] = useState([]);
  // Using a ref to avoid stale closure issues in the timer callback
  const timerActiveRef = useRef(true);

  // Transform and load questions from JSON on mount
  useEffect(() => {
    const transformedQuestions = data.map((q) => {
      const decodedQuestion = decodeURIComponent(q.question);
      const decodedCorrect = decodeURIComponent(q.correct_answer);
      const options = q.incorrect_answers.map((ans) => ({
        text: decodeURIComponent(ans),
        isCorrect: false,
      }));
      options.push({ text: decodedCorrect, isCorrect: true });
      const shuffledOptions = shuffleArray(options);
      return {
        question: decodedQuestion,
        options: shuffledOptions,
      };
    });
    setQuestions(transformedQuestions);
  }, []);

  // Timer effect: resets with each new question and auto-submits when time runs out
  useEffect(() => {
    setTimeLeft(20);
    setTimerActive(true);
    timerActiveRef.current = true;
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (timerActiveRef.current) {
            // Time's up: record as no answer and auto-move to next question
            handleAnswer(false, "No Answer", true);
            timerActiveRef.current = false;
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestion]);

  // Handle answer submission (manual click or auto-timeout)
  const handleAnswer = (isCorrect, selectedAnswerText, isTimeout = false) => {
    if (!timerActiveRef.current) return;
    timerActiveRef.current = false;
    setTimerActive(false);

    // Update the score if the answer is correct
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    // Get the correct answer text
    const correctOption = questions[currentQuestion].options.find(
      (opt) => opt.isCorrect
    );
    const correctAnswerText = correctOption ? correctOption.text : "";

    // Record user's answer details
    setUserAnswers((prev) => [
      ...prev,
      {
        question: questions[currentQuestion].question,
        yourAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect: isCorrect,
      },
    ]);

    // Show Swal alerts only for manual answers
    if (!isTimeout) {
      if (isCorrect) {
        Swal.fire({
          title: "Correct!",
          text: "Good job!",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          title: "Wrong Answer!",
          text: "Better luck next time!",
          icon: "error",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    }
    // Proceed to the next question immediately for timeouts, else after a 1-second delay
    const delay = isTimeout ? 0 : 1000;
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
      } else {
        setQuizFinished(true);
      }
    }, delay);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setQuizFinished(false);
    setTimeLeft(20);
    setTimerActive(true);
    timerActiveRef.current = true;
    setUserAnswers([]);
  };

  if (questions.length === 0) {
    return <div className="text-center text-xl mt-10">Loading Quiz...</div>;
  }

  // Timer progress bar calculations
  const progressPercentage = (timeLeft / 20) * 100;
  let progressColor = "bg-green-500";
  if (timeLeft <= 7) {
    progressColor = "bg-red-500";
  } else if (timeLeft <= 13) {
    progressColor = "bg-yellow-500";
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
          Quiz Master
        </h1>
        <p className="text-lg text-white mt-2">
          Test your knowledge and have fun!
        </p>
      </header>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 animate__animated animate__fadeIn">
        {!quizFinished ? (
          <div>
            {/* Header with question count and score */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Question {currentQuestion + 1} of {questions.length}
              </h2>
              <div className="text-xl font-semibold text-gray-700">
                Score: {score}
              </div>
            </div>
            {/* Timer Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`${progressColor} h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-right text-sm mt-1 text-gray-600">
                {timeLeft} sec
              </p>
            </div>
            {/* Question and options */}
            <div className="mb-8">
              <p className="text-xl font-medium text-gray-800 mb-4">
                {questions[currentQuestion].question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswer(option.isCorrect, option.text)
                    }
                    className="w-full text-left p-4 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Quiz Finished View
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Quiz Finished!
            </h2>
            <p className="text-xl text-gray-700 mb-6">
              Final Score: {score} / {questions.length}
            </p>
            {/* Summary Table */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 border">Question</th>
                    <th className="px-4 py-2 border">Your Answer</th>
                    <th className="px-4 py-2 border">Correct Answer</th>
                    <th className="px-4 py-2 border">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {userAnswers.map((ans, index) => (
                    <tr key={index} className="text-center border-b">
                      <td className="px-4 py-2 text-left">{ans.question}</td>
                      <td className="px-4 py-2">{ans.yourAnswer}</td>
                      <td className="px-4 py-2">{ans.correctAnswer}</td>
                      <td className="px-4 py-2">
                        {ans.isCorrect ? (
                          <span className="text-green-600 font-bold">
                            Correct
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">Wrong</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={restartQuiz}
              className="bg-indigo-500 text-white px-8 py-3 rounded-full hover:bg-indigo-600 transition-colors"
            >
              Restart Quiz
            </button>
          </div>
        )}
      </div>
      <footer className="mt-6 text-white">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Quiz Master. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default QuizApp;