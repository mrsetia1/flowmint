import axios from 'axios';
import { useEffect, useState } from 'react';

function App() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/articles')
      .then(res => setArticles(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">FlowMint - Fresh Content, Seamless Control</h1>
      <div className="grid gap-4">
        {articles.map(article => (
          <div key={article.id} className="p-4 border rounded shadow">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p>{article.content}</p>
            <span className="text-sm text-gray-500">{article.category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;