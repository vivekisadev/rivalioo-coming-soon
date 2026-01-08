import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ComingSoon from './pages/ComingSoon';

import logoFull from './assets/images/logo_full.png';
import { AuthProvider } from './context/AuthContext';
import { TransitionProvider } from './context/TransitionContext';
import SmoothScroll from './components/SmoothScroll';

function App() {
  return (
    <AuthProvider>
      <Router>
        <TransitionProvider>
          <div className="min-h-screen bg-rival-dark text-white overflow-x-hidden selection:bg-rival-teal selection:text-rival-dark font-sans flex flex-col relative">
            {/* Global Background Glow */}
            <div className="hidden lg:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-70">
              <img
                src={logoFull}
                alt=""
                className="w-[800px] blur-3xl opacity-70 drop-shadow-[0_0_200px_#00D9FF]"
              />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
              <SmoothScroll>
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<ComingSoon />} />

                  </Routes>
                </main>
              </SmoothScroll>
            </div>
          </div>
        </TransitionProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
