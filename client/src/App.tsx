import { Router, Route, Switch } from 'wouter';
import { Dashboard } from '@/pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <main>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route>
              <div className="flex items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}

export default App;