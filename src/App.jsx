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
  const [loginError, setLoginError] = useState(null);

  // Card Animation Values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  // Dynamic background color: Red (Left) -> Blue (Center) -> Green (Right)
  const bgColor = useTransform(x, [-200, 0, 200], ['#ef4444', '#2563eb', '#22c55e']);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
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
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Login success:", result);
    } catch (error) {
      console.error("Login failed", error);
      setLoginError(error.message);
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
    const text = `I scored ${getVibePercentage()}% on the #ETHMumbai Maxi Checker! My rank: ${getRank()}. Can you beat me? @ethmumbai 👇`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#E2231A] to-[#990000] text-white">Loading...</div>;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#E2231A] to-[#990000] text-white flex flex-col items-center p-4 font-sans overflow-hidden">
      <header className="w-full max-w-md flex justify-between items-center py-4 z-10">
        <div className="flex items-center gap-2">
            <span className="text-2xl">🚌</span>
            <h1 className="text-2xl font-bold text-white">
            ETHMumbai Maxi
            </h1>
        </div>
        {user && (
          <button onClick={handleLogout} className="text-sm text-white/80 hover:text-white font-medium bg-black/20 px-3 py-1 rounded-full">
            Logout
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center relative">
        {!user ? (
          <div className="text-center space-y-6 px-4">
            <h2 className="text-5xl font-black mb-4 text-white leading-tight drop-shadow-md">
              How Big of an <br/>
              <span className="relative inline-block z-10">
                ETHMumbai
                <span className="absolute bottom-2 left-0 w-full h-4 bg-bus-yellow -z-10 transform -rotate-1 rounded-sm"></span>
              </span>
              <br/> Maxi Are You?
            </h2>
            <p className="text-white/90 mb-8 text-xl font-medium">
              Let your swipes prove your love for ETHMumbai 💛
            </p>
            {loginError && (
              <div className="bg-white/10 border border-white/20 text-white p-4 rounded-lg text-sm mb-4">
                {loginError}
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#1DA1F2] text-white hover:bg-[#1a91da] font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 shadow-xl text-lg"
            >
              <FaTwitter className="text-2xl" /> Login with Twitter
            </button>
          </div>
        ) : gameOver ? (
          <div className="w-full space-y-6 text-center animate-fade-in px-2 pb-8 overflow-y-auto max-h-[80vh]">
            <div className="bg-white text-bus-black p-8 rounded-3xl shadow-2xl border-4 border-bus-yellow">
              <h2 className="text-3xl font-bold mb-2 text-best-red">Vibe Check Complete</h2>
              <div className="text-8xl font-black text-bus-black mb-4">
                {getVibePercentage()}%
              </div>
              <p className="text-xl text-gray-600 mb-8 font-medium">
                {getVibePercentage() > 80 ? "Certified ETH Maxi! 🦄" : "Normie Alert! 🚨"}
              </p>
              
              <button
                onClick={shareOnTwitter}
                className="w-full flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-4 px-6 rounded-xl transition-all mb-4 shadow-lg text-lg"
              >
                <FaTwitter /> Share Result
              </button>
              
              <button
                onClick={resetGame}
                className="text-gray-500 hover:text-black underline py-2"
              >
                Play Again
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-left flex items-center gap-2 text-white">
                <span className="text-bus-yellow">🏆</span> Leaderboard
              </h3>
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/90 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono w-6 font-bold ${idx < 3 ? 'text-best-red' : 'text-gray-500'}`}>
                        #{idx + 1}
                      </span>
                      <img src={entry.photoURL} alt={entry.displayName} className="w-10 h-10 rounded-full border-2 border-gray-200" />
                      <span className="font-medium truncate max-w-[120px] text-bus-black">{entry.displayName}</span>
                    </div>
                    <span className="font-bold text-best-red">{entry.score} pts</span>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-white/60">No scores yet.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[60vh] flex items-center justify-center">
            <AnimatePresence>
              {lastSwipeResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 0 }}
                  animate={{ opacity: 1, scale: 1.2, y: -50 }}
                  exit={{ opacity: 0 }}
                  className={`absolute top-10 z-50 text-6xl font-black tracking-tighter ${lastSwipeResult === 'correct' ? 'text-bus-green drop-shadow-[0_0_10px_rgba(0,168,89,0.5)]' : 'text-best-red drop-shadow-[0_0_10px_rgba(226,35,26,0.5)]'}`}
                >
                  {lastSwipeResult === 'correct' ? 'BASED!' : 'CRINGE!'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Card */}
            <motion.div
              style={{ x, rotate, backgroundColor: bgColor }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={onDragEnd}
              whileTap={{ cursor: "grabbing" }}
              className="absolute w-full max-w-sm h-[500px] rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 cursor-grab border-4 border-white/20 z-10"
            >
              <div className="text-center w-full">
                <div className="mb-8">
                  <span className="inline-block px-4 py-1 rounded-full bg-black/20 text-sm font-bold tracking-widest text-white/80 mb-2">
                    VIBE CHECK {currentIndex + 1}/{questions.length}
                  </span>
                </div>
                
                <h2 className="text-4xl font-black text-white mb-8 leading-tight drop-shadow-lg">
                  {questions[currentIndex].text}
                </h2>
                
                <p className="text-white/60 text-sm font-medium">
                  Swipe Right for YES <br/> Swipe Left for NO
                </p>
              </div>
            </motion.div>

            <div className="absolute -bottom-24 text-white/50 text-sm font-medium animate-pulse">
                Swipe Left or Right to decide
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
