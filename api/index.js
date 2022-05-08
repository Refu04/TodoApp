import express from 'express';
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
    app.get('/getall', (req, res) => {
      Todo.findAll({})
      .then(result =>{
        res.send(result);
      })
    });
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
    })
    app.post('/updateitem', (req, res) => {
      Todo.update(
        {done: req.body.done},
        {where: {key: req.body.key}}
      );
    })
}

app.listen(process.env.PORT || PORT);