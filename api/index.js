import express from 'express';
import axios from 'axios';
import cron from 'node-cron';
import cors from 'cors';
import Sequelize from 'sequelize';

//接続先DB情報
const user = 'admin'
const host = 'db'
const database = 'todo_db'
const password = 'admin'
const port = '5432'
let pg_option = {};

//環境に応じて情報を更新する
if(process.env.DATABASE_URL) {
  DB_INFO = process.env.DATABASE_URL;
  pg_option = { ssl: { rejectUnauthorized: false } };
}

const sequelize = new Sequelize(database, user, password ,{
  host,
  port,
  dialect: 'postgres',
  dialectOptions: pg_option
});

const PORT = 8080;
const app = express();
app.use(cors());
app.use(express.json());

//Todosテーブルの作成
const Todo = sequelize.define('todoItem', {
    key: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    text: { type: Sequelize.TEXT },
    date: { type: Sequelize.TEXT },
    done: { type: Sequelize.BOOLEAN }
},{
    timestamps: false
});
//Webhooksテーブルの作成
const Webhooks = sequelize.define('webhook', {
  key: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  url: { type: Sequelize.TEXT }
},{
  timestamps: false
});
//postgresqlへの反映
sequelize.sync({force: false, alter: true})
.then(setupRoute)
.catch((mes) => {
  console.log("db connection error");
  console.log(mes);
});

//ルーティング
function setupRoute() {
    console.log("db connection succeeded");
    //全てのTodoItemを返す
    app.get('/getall', (req, res) => {
      Todo.findAll({})
      .then(result =>{
        res.send(result);
      });
    });
    //新たなTodoItemを登録する
    app.post('/setitem', (req, res) => {
      let item = new Todo({
        text: req.body.text,
        date: req.body.date,
        done: false
      });
      item.save()
      .then((mes) =>{
        res.send(mes.dataValues);
      });
      //通知を設定する
      let min = parseInt(req.body.date.slice(14, 16));
      let hours = parseInt(req.body.date.slice(11, 13));
      let date = parseInt(req.body.date.slice(8, 10));
      let month = parseInt(req.body.date.slice(5, 7));
      //WebhookURL取得
      let url = null;
      Webhooks.findOne({})
      .then(h => {
        url = h.url;
      });
      //指定時間にdiscordWebhookにメッセージ送信
      cron.schedule(`${min} ${hours} ${date} ${month} *` ,() => {
        axios.post(
          url,
          {
            "content": `${req.body.text}  ${req.body.date}`
          });
      },{
        scheduled: true,
        timezone: "Asia/Tokyo"
      });
      
    })
    //TodoItemを更新する
    app.post('/updateitem', (req, res) => {
      Todo.update(
        {done: req.body.done},
        {where: {key: req.body.key}}
      );
    })
    //WebhookURLを設定する
    app.post('/setwebhook', (req, res) => {
      //既に設定が存在するか確認、存在する場合削除
      Webhooks.findOne({})
      .then(hook => {
        hook.destroy();
      });
      //新たにWenhookURLを設定
      let hook = new Webhooks({url: req.body.url});
      hook.save()
      .then((mes) =>{
        res.send(mes.dataValues);
      });
    })
    app.get('/getwebhook', (req, res) => {
      Webhooks.findOne({})
      .then(result => {
        res.send(result);
      });
    })
}

app.listen(process.env.PORT || PORT);