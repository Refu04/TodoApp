import React, { useEffect } from 'react';
import axios from 'axios';
import  classNames from 'classnames'
import 'bulma/css/bulma.css';
import DatePicker, {registerLocale} from "react-datepicker";
import ja from 'date-fns/locale/ja';
import "react-datepicker/dist/react-datepicker.css"

const getKey = () => Math.random().toString(32).substring(2);
const baseURL = "http://localhost:8080/"
function Todo(){
  //タスク一覧
  const [items, setItems] = React.useState([
    { key: getKey(), text: 'Learn JavaScript', done: false, date: ''},
    { key: getKey(), text: 'Learn React', done: false, date: '' },
    { key: getKey(), text: 'Get some good sleep', done: false, date: '' },
  ]);
  //データベースからタスク一覧を取得してくる
  useEffect(() => {
    const fetchdata = async() => {
      const result = await axios.get(`${baseURL}getall`);
      setItems(result.data);
    };
    fetchdata();
  }, []);
  //フィルターの状態
  const [filter, setFilter] = React.useState('ALL');
  const handleFilterChange = value => setFilter(value);
  //フィルターの状態に合わせて、表示すべきものを抽出する
  const displayItems = items.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'TODO') return !item.done;
    if (filter === 'DONE') return item.done;
    return false;
  });
  //タスクをチェックした際のハンドラ関数
  //チェックされたアイテムのdoneの真偽を反転させる
  const handleCheck = checked => {
    const newItems = items.map(item => {
      if (item.key === checked.key) {
        item.done = !item.done;
        //データベースへ反映
        axios.post(`${baseURL}updateitem`, {key: item.key, done: item.done});
      }
      return item;
    });
    setItems(newItems);
  };
  //タスクを追加する際のハンドラ関数
  const handleAdd = (text, date) => {
  var formatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  .replace(/\n|\r/g, '');
    setItems([...items, { key: getKey(), text: text, done: false, date: formatted }]);
    //データベースへ反映
    axios.post(`${baseURL}setitem`, {text: text, date: formatted});
  };
  return (
    <div className="panel">
      {/* 入力フィールドの表示 */}
      <Input onAdd={handleAdd} />
      {/* フィルタリングをするボタン */}
      <Filter onChange={handleFilterChange} value={filter} />
      {/* フィルターに応じたタスクを表示する */}
      {displayItems.map(item => (
        <TodoItem key={item.key} item={item} onCheck={handleCheck}/>
      ))}
      <div className="panel-block">
        {displayItems.length} items
      </div>
    </div>
  );
}

function Settings(){
  //WebhookURL
  const [currentUrl, setCurrentUrl] = React.useState('');
  const [url, setUrl] = React.useState('');
  const handleCurrentUrlChange = e => setCurrentUrl(e.target.value);
  const handleAdd = e => {
    //データベースへ反映
    axios.post(`${baseURL}setwebhook`, {url: currentUrl});
    setUrl(currentUrl);
    setCurrentUrl('');
  }
  //データベースからWebhookURLを取得してくる
  useEffect(() => {
    const fetchdata = async() => {
      const result = await axios.get(`${baseURL}getwebhook`);
      setUrl(result.data.url);
    };
    fetchdata();
  }, []);
  return(
    <div>
      <div className="panel-block">
        <input className="input" type="text" placeholder="DiscordWebhookを入力" value={currentUrl} onChange={handleCurrentUrlChange} />
        <input className='button is-success' type="button" value="Add" onClick={handleAdd} />
      </div>
      <h1>現在設定されているURL: {url}</h1>
    </div>
    
  );
}

function Navbar({onChange}) {
  const handleClick = (key, e) => {
    e.preventDefault();
    onChange(key);
  };
  return (
    <nav className="navbar is-light" role="navigation" aria-label="main navigation">
      <div id="navbarBasicExample" className="navbar-menu">
        <div className="navbar-start">
          <a className="navbar-item" href='/#' onClick={handleClick.bind(null, 'Home')}>Home</a>
          <a className="navbar-item" href='/#' onClick={handleClick.bind(null, 'Settings')}>Settings</a>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">
              <a className="button is-primary" href='/#'>
                <strong>Sign up</strong>
              </a>
              <a className="button is-light" href='/#'>Log in</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function TodoItem({ item, onCheck }) {
  const handleChange = () => {
    onCheck(item);
  };
  return (
    <div className='panel-block columns'>
      <div className="column is-three-quarters">
        {/* タスクがチェックされたらハンドラ関数を実行する */}
        <input type="checkbox" checked={item.done} onChange={handleChange} />
        {/* item.doneがtrueであればhas-text-grey-lightクラスを割り当てる */}
        <span className={classNames({ 'has-text-grey-light': item.done })}>
          {item.text}
        </span>
      </div>
      <div className="column">
        {/* タスク期限を表示する */}
        <span className={classNames({ 'has-text-grey-light': item.done })}>
          {item.date}
        </span>
      </div>
    </div>
  );
}

//タスクの入力フィールド
function Input({onAdd}) {
  //タスク内容
  const [text, setText] = React.useState('');
  //タスク期限
  const [date, setDate] = React.useState(new Date());
  registerLocale('ja', ja);
  //文字が入力された際のハンドラ関数
  const handleTextChange = e => setText(e.target.value);
  //日付が入力された際のハンドラ関数
  const handleDateChange = e => setDate(e);
  //キーが押された際のハンドラ関数
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      onAdd(text, date);
      setText('');
      setDate(new Date());
    }
  }
  //追加ボタンが押された際のハンドラ関数
  const handleAdd = e => {
    onAdd(text, date);
    setText('');
    setDate(new Date());
  }
  return(
    <div className="panel-block">
      <input className="input" type="text" placeholder="タスクを入力" value={text} onChange={handleTextChange} onKeyDown={handleKeyDown}
      />
      <DatePicker 
        className="input" 
        dateFormat="yyyy/MM/dd HH:mm" 
        locale='ja' showTimeSelect selected={date} 
        onChange={handleDateChange} 
        />
      <input className='button is-success' type="button" value="Add" onClick={handleAdd} />
    </div>
  );

}

//フィルター機能
function Filter({ value, onChange }) {
  // 押下されたリンクに応じてフィルターを切り替える
  const handleClick = (key, e) => {
    e.preventDefault();
    onChange(key);
  };

  return (
    <div className="panel-tabs">
      <a
        href="/#"
        onClick={handleClick.bind(null, 'ALL')}
        className={classNames({ 'is-active': value === 'ALL' })}
      >All</a>
      <a
        href="/#"
        onClick={handleClick.bind(null, 'TODO')}
        className={classNames({ 'is-active': value === 'TODO' })}
      >ToDo</a>
      <a
        href="/#"
        onClick={handleClick.bind(null, 'DONE')}
        className={classNames({ 'is-active': value === 'DONE' })}
      >Done</a>
    </div>
  );
}

function App() {
  const [state, setState] = React.useState('Home');
  const handleStateChange = value => {
    setState(value)
  };

  const contents = (value) => {
    switch(value){
      case 'Home':
        return <Todo />
      case 'Settings':
        return <Settings />
      default:
        break;
    }
  }
  return(
    <div className="App">
      <Navbar onChange={handleStateChange}/>
      {contents(state)}
    </div>
  );
}

export default App;
