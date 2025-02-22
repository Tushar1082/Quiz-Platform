import React, { useState, useEffect } from "react";
import { openDB } from "idb";
import "./quiz.css";

const mcqQuestions = [
    { id: 1, question: "Which planet is closest to the Sun?", options: ["A) Venus", "B) Mercury", "C) Earth", "D) Mars"], answer: "B) Mercury" },
    { id: 2, question: "Which data structure organizes items in a FIFO manner?", options: ["A) Stack", "B) Queue", "C) Tree", "D) Graph"], answer: "B) Queue" },
    { id: 3, question: "Which of the following is primarily used for structuring web pages?", options: ["A) Python", "B) Java", "C) HTML", "D) C++"], answer: "C) HTML" },
    { id: 4, question: "Which chemical symbol stands for Gold?", options: ["A) Au", "B) Gd", "C) Ag", "D) Pt"], answer: "A) Au" },
    { id: 5, question: "Which process is not typically involved in refining petroleum?", options: ["A) Fractional distillation", "B) Cracking", "C) Polymerization", "D) Filtration"], answer: "D) Filtration" }
];

const integerQuestions = [
    { id: 6, question: "What is the value of 12 + 28?", answer: "40" },
    { id: 7, question: "How many states are there in the United States?", answer: "50" },
    { id: 8, question: "In which year was the Declaration of Independence signed?", answer: "1776" },
    { id: 9, question: "What is the value of pi rounded to the nearest integer?", answer: "3" },
    { id: 10, question: "If a car travels at 60 mph for 2 hours, how many miles does it travel?", answer: "120" }
];

// Function to initialize IndexedDB
const initDB = async () => {
    return openDB("QuizHistoryDB", 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("history")) {
                db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
            }
        }
    });
};

// Function to save quiz history
const saveHistory = async (score) => {
    const db = await initDB();
    const tx = db.transaction("history", "readwrite");
    const store = tx.objectStore("history");
    await store.add({ date: new Date().toLocaleString(), score });
};

// Function to get quiz history
const getHistory = async () => {
    const db = await initDB();
    return await db.getAll("history");
};

// Function to clear history
const clearHistory = async () => {
    const db = await initDB();
    const tx = db.transaction("history", "readwrite");
    await tx.objectStore("history").clear();
};

const Quiz = () => {
    const [round, setRound] = useState(1);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showScoreCard, setShowScoreCard] = useState(false);
    const [history, setHistory] = useState([]);

    const questions = round === 1 ? mcqQuestions : integerQuestions;

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === 1) {
                    nextQuestion();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [currentQuestion]);

    useEffect(() => {
        const loadHistory = async () => {
            const savedHistory = await getHistory();
            setHistory(savedHistory);
        };
        loadHistory();
    }, []);

    const handleAnswerClick = (option) => {
        setSelectedAnswer(option);
        if (option === questions[currentQuestion].answer) {
            setFeedback("✅ Correct!");
            setScore(score + 1);
        } else {
            setFeedback("❌ Wrong answer!");
        }
    };

    const handleIntegerSubmit = (e) => {
        e.preventDefault();
        if (selectedAnswer === questions[currentQuestion].answer) {
            setFeedback("✅ Correct!");
            setScore(score + 1);
        } else {
            setFeedback("❌ Wrong answer!");
        }
    };

    const nextQuestion = async () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setFeedback("");
            setTimeLeft(30);
        } else {
            if (round === 1) {
                setRound(2);
                setCurrentQuestion(0);
                setTimeLeft(30);
            } else {
                setShowScoreCard(true);
                await saveHistory(score);
                setHistory(await getHistory());
            }
        }
    };

    const restartQuiz = () => {
        setRound(1);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setFeedback("");
        setScore(0);
        setShowScoreCard(false);
        setTimeLeft(30);
    };

    const handleClearHistory = async () => {
        await clearHistory();
        setHistory([]);
    };

    return (
        <div id="mainQuiz">
            <div className="quiz-logo">
                <div>
                    <img src="logo.jpeg" alt="error" />
                </div>
                <div>
                    <h1 style={{fontStyle:'italic'}}>Quiz Platform</h1>
                </div>
            </div>
            <div className="quiz-container">
                {showScoreCard ? (
                    <div className="score-card">
                        <h2>🎉 Quiz Completed!</h2>
                        <p>Your Score: <span className="score">{score}/{mcqQuestions.length + integerQuestions.length}</span></p>
                        <button className="restart-button" onClick={restartQuiz}>🔄 Restart Quiz</button>
                    </div>
                ) : (
                    <>
                        <h2>{round === 1 ? "🧠 Multiple-Choice Questions" : "🔢 Integer-Type Questions"}</h2>
                        <div className="question-box">
                            <p className="timer">⏳ Time Left: {timeLeft}s</p>
                            <h3>{questions[currentQuestion].question}</h3>
                            <div className="options-container">
                                {round === 1 ? (
                                    questions[currentQuestion].options.map((option) => (
                                        <button key={option} onClick={() => handleAnswerClick(option)} className="option-button">
                                            {option}
                                        </button>
                                    ))
                                ) : (
                                    <form onSubmit={handleIntegerSubmit} className="form-Quiz">
                                        <input type="number" value={selectedAnswer || ""} onChange={(e) => setSelectedAnswer(e.target.value)} />
                                        <button type="submit">Submit</button>
                                    </form>
                                )}
                            </div>
                            {feedback && <p className="feedback">{feedback}</p>}
                            <button onClick={nextQuestion} className="next-button">➡️ Next</button>
                        </div>
                    </>
                )}

                <div className="history-section">
                    <h2>📜 Quiz History</h2>
                    {history.length > 0 ? (
                        <ul>
                            {history.map((attempt, index) => (
                                <li key={index}>Attempt {index + 1}: {attempt.score}/{mcqQuestions.length + integerQuestions.length} on {attempt.date}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No quiz history available.</p>
                    )}
                    <button className="clear-history-button" onClick={handleClearHistory}>🗑️ Clear History</button>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
