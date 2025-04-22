import { useState, useEffect } from 'react';
import { Link } from 'react-router';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false);

  // Check if user is logged in (replace with your actual auth logic)
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    checkLoginStatus();
  }, []);


  return (
    <div className="bg-background-dark text-text-light">
      {/* Header */}
      <header className="px-6 py-4 border-b border-card-dark">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">DocScan</h1>
          </div>
          <div>
            {isLoggedIn ? (
              <>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login">
                  <button
                    className="px-6 py-2 border border-accent text-text-white hover:bg-accent hover:text-text-white rounded-md transition-colors"
                  >
                    Log In
                  </button>
                </Link>
                <Link to="/signup">
                  <button
                    className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-md transition-colors"
                  >
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Document Analysis for Educators</h2>
          <p className="text-text-muted text-xl max-w-3xl mx-auto mb-10">
            Harness the power of AI to analyze student documents, identify patterns, and gain valuable insights for improved teaching outcomes.
          </p>
          {isLoggedIn ? (
            <Link to="/dashboard">
              <button
                className="px-8 py-3 text-lg bg-accent hover:bg-accent-hover rounded-md transition-colors"
              >
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <Link to="/signup">

              <button
                className="px-8 py-3 text-lg bg-accent hover:bg-accent-hover rounded-md transition-colors"
              >
                Get Started
              </button>
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card-dark">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-16">Powerful Document Analysis Tools</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<></>}
              title="AI-Powered Analysis"
              description="Utilize advanced LLMs to extract insights from student submissions, identify trends, and highlight key concepts."
            />
            <FeatureCard
              icon={<></>}
              title="Comprehensive Reporting"
              description="Generate detailed reports on student performance, understanding, and engagement across multiple documents."
            />
            <FeatureCard
              icon={<></>}
              title="Teaching Insights"
              description="Gain valuable insights to adjust teaching strategies, identify struggling students, and focus on challenging concepts."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card-dark border-t border-secondary">
        <div className="container mx-auto px-4 text-center text-text-muted">
          <p>© {new Date().getFullYear()} DocScan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: any, title: string, description: string }) => {
  return (
    <div className="p-6 bg-background-dark rounded-lg text-center">
      <div className="flex justify-center">
        {icon}
      </div>
      <h4 className="text-xl font-semibold mb-3">{title}</h4>
      <p className="text-text-muted">{description}</p>
    </div>
  );
};

export default Home;
