
import Editor from '@monaco-editor/react';
import React, { useRef, useEffect } from 'react';

const CodeEditor = ({ language, value, onChange }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Force relayout after short delay
    setTimeout(() => editor.layout(), 100);
  };

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) editorRef.current.layout();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Editor
      height="100%"
      width="100%"
      theme="vs-dark"
      language={language}
      value={value}
      onMount={handleEditorDidMount}
      onChange={onChange}
      options={{
        fontSize: 16,
        minimap: { enabled: false },
        wordWrap: 'on',
        automaticLayout: false, // disable this to avoid ResizeObserver spam
      }}
    />
  );
};

export default CodeEditor;