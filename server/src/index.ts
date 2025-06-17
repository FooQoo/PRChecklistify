import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

// JSONボディのパース
app.use(express.json());

// サンプルAPIエンドポイント
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

// サンプルPOSTエンドポイント
app.post('/api/echo', (req, res) => {
  res.json({ youSent: req.body });
});

// サーバー起動
app.listen(port, () => {
  console.log(`Express API server listening at http://localhost:${port}`);
});
