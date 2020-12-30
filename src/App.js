import { Button } from 'antd';
import getResult from './api';
import { execFile } from 'child_process';
import { DragUpload } from './upload_component';
import './App.css';

function App() {
  const child = execFile('node', ['--version'], (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    console.log(stdout);
  });
  return (
    <div>
      <DragUpload />
      {/* <Button
        onClick={getResult}
      >
        Communicate with API
      </Button> */}
    </div>
  );
}

export default App;
