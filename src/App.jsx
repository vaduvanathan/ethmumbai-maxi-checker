import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, provider, db } from './firebase';
import { questions } from './data/questions';
import { FaTwitter, FaHeart, FaTimes, FaCheck } from 'react-icons/fa';

function App() {
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSwipeResult, setLastSwipeResult] = useState(null); // 'correct' or 'incorrect'

  // Card Animation Values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const bgColor = useTransform(x, [-200, 0, 200], ['#ef4444', '#1f2937', '#22c55e']); // Red to Gray to Green

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (gameOver) {
      saveScore();
      fetchLeaderboard();
    }
  }, [gameOver]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    resetGame();
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setLastSwipeResult(null);
  };

  const handleSwipe = (direction) => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = direction === currentQuestion.correctSwipe;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setLastSwipeResult('correct');
    } else {
      setLastSwipeResult('incorrect');
    }

    setTimeout(() => {
      setLastSwipeResult(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        x.set(0);
      } else {
        setGameOver(true);
      }
    }, 500);
  };

  const onDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      handleSwipe('right');
    } else if (info.offset.x < -100) {
      handleSwipe('left');
    }
  };

  const saveScore = async () => {
    if (user) {
      try {
        // Use setDoc with merge to update existing user score if higher, or just overwrite
        // For simplicity, we'll just add a new entry or update the user's best score
        // Here we assume one entry per user for the leaderboard
        const userScoreRef = doc(db, "scores", user.uid);
        await setDoc(userScoreRef, {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          score: score,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Error saving score", error);
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const scores = [];
      querySnapshot.forEach((doc) => {
        scores.push(doc.data());
      });
      setLeaderboard(scores);
    } catch (error) {
      console.error("Error fetching leaderboard", error);
    }
  };

  const getVibePercentage = () => {
    return Math.round((score / questions.length) * 100);
  };

  const getRank = () => {
    // In a real app, you'd query the DB to find the rank.
    // Here we'll just mock it or calculate based on loaded leaderboard if possible
    return "Top 10%"; 
  };

  const shareOnTwitter = () => {
    const text = `I scored ${getVibePercentage()}% on the #ETHMumbai Maxi Checker! My rank: ${getRank()}. Can you beat me? 👇`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 font-sans">
      <header className="w-full max-w-md flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-eth-pink to-eth-purple">
          ETHMumbai Maxi
        </h1>
        {user && (
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
            Logout
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center relative">
        {!user ? (
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold mb-4">Check Your Vibe</h2>
            <p className="text-gray-400 mb-8">Swipe right if it's ETHMumbai vibes. Swipe left if it's not.</p>
            <button
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
            >
              <FaTwitter /> Login with Twitter
            </button>
          </div>
        ) : gameOver ? (
          <div className="w-full space-y-6 text-center animate-fade-in">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-3xl font-bold mb-2">Vibe Check Complete</h2>
              <div className="text-6xl font-black text-eth-green mb-4">{getVibePercentage()}%</div>
              <p className="text-xl text-gray-300 mb-6">
                {getVibePercentage() > 80 ? "Certified ETH Maxi! 🦄" : "Normie Alert! 🚨"}
              </p>
              
              <button
                onClick={shareOnTwitter}
                className="w-full flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-3 px-6 rounded-xl transition-all mb-4"
              >
                <FaTwitter /> Share Result
              </button>
              
              <button
                onClick={resetGame}
                className="text-gray-400 hover:text-white underline"
              >
                Play Again
              </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-left flex items-center gap-2">
                <span className="text-yellow-500">🏆</span> Leaderboard
              </h3>
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-400 w-6">#{idx + 1}</span>
                      <img src={entry.photoURL} alt={entry.displayName} className="w-8 h-8 rounded-full" />
                      <span className="font-medium truncate max-w-[120px]">{entry.displayName}</span>
                    </div>
                    <span className="font-bold text-eth-purple">{entry.score} pts</span>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-gray-500">No scores yet.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[400px] flex items-center justify-center">
            <AnimatePresence>
              {lastSwipeResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  className={`absolute z-50 text-6xl font-bold ${lastSwipeResult === 'correct' ? 'text-green-500' : 'text-red-500'}`}
                >
                  {lastSwipeResult === 'correct' ? 'NICE!' : 'NOPE!'}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              style={{ x, rotate, backgroundColor: bgColor }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={onDragEnd}
              className="absolute w-full max-w-sm h-96 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 cursor-grab active:cursor-grabbing border-4 border-gray-700"
            >
              <div className="text-center">
                <span className="text-sm uppercase tracking-widest text-gray-400 mb-4 block">
                  Question {currentIndex + 1}/{questions.length}
                </span>
                <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
                  {questions[currentIndex].text}
                </h2>
              </div>
              
              <div className="absolute bottom-8 flex w-full justify-between px-12 text-4xl opacity-50">
                <FaTimes className="text-red-300" />
                <FaCheck className="text-green-300" />
              </div>
            </motion.div>

            <div className="absolute -bottom-24 flex gap-8">
              <button
                onClick={() => handleSwipe('left')}
                className="w-16 h-16 rounded-full bg-gray-800 border-2 border-red-500 text-red-500 flex items-center justify-center text-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
              >
                <FaTimes />
              </button>
              <button
                onClick={() => handleSwipe('right')}
                className="w-16 h-16 rounded-full bg-gray-800 border-2 border-green-500 text-green-500 flex items-center justify-center text-2xl hover:bg-green-500 hover:text-white transition-all shadow-lg"
              >
                <FaCheck />
              </button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-8 text-gray-500 text-xs text-center">
        <p>ETHMumbai 2026 Hackathon Project</p>
      </footer>
    </div>
  );
}

export default App;
