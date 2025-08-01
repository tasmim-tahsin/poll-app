import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import QRCodeDisplay from '../components/QRCodeDisplay';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [customSessionId, setCustomSessionId] = useState('');
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', ''] }]);
  const [sessionId, setSessionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*, questions(*)')
      .order('created_at', { ascending: false });
    setSessions(data || []);
  };

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', ''] }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestionText = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].question_text = value;
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 2) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
      setQuestions(newQuestions);
    }
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCreateSession = async () => {
    if (!customSessionId.trim() || questions.some(q => !q.question_text.trim() || q.options.some(opt => !opt.trim()))) {
      alert('Please fill in the session name, all questions, and all options');
      return;
    }

    setLoading(true);
    try {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{ id: customSessionId.trim() }])
        .select()
        .single();

      if (sessionError) {
        if (sessionError.code === '23505') { // Unique constraint violation
          alert('This session name already exists. Please choose a different one.');
        } else {
          throw sessionError;
        }
        return;
      }

      // Create questions and options
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert([{ session_id: sessionData.id, question_text: q.question_text.trim(), question_order: i + 1 }])
          .select()
          .single();
        
        if (questionError) throw questionError;

        const optionsData = q.options
          .filter(opt => opt.trim())
          .map((option, index) => ({
            question_id: questionData.id,
            option_text: option.trim(),
            option_order: index + 1
          }));

        const { error: optionsError } = await supabase
          .from('session_options')
          .insert(optionsData);

        if (optionsError) throw optionsError;
      }

      setSessionId(sessionData.id);
      const url = `${window.location.origin}/poll/${sessionData.id}`;
      setQrCodeUrl(url);
      
      // Reset form
      setCustomSessionId('');
      setQuestions([{ question_text: '', options: ['', ''] }]);
      
      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionStatus = async (sessionId, currentStatus) => {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: !currentStatus })
      .eq('id', sessionId);

    if (!error) {
      fetchSessions();
    }
  };

  const exportToCSV = async (session) => {
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*, session_options(*)')
      .eq('session_id', session.id);

    if (questionsError) {
      console.error('Error fetching questions for CSV export:', questionsError);
      return;
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*, questions!inner(session_id)')
      .eq('questions.session_id', session.id);

    if (votesError) {
      console.error('Error fetching votes for CSV export:', votesError);
      return;
    }

    const allResults = [];
    questions.forEach(q => {
      const questionVotes = votes.filter(vote => vote.question_id === q.id);
      q.session_options.forEach(o => {
        allResults.push({
          question: q.question_text,
          option: o.option_text,
          votes: questionVotes.filter(v => v.selected_option_id === o.id).length
        });
      });
    });

    const csv = Papa.unparse(allResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `poll-results-${session.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (session) => {
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*, session_options(*)')
      .eq('session_id', session.id);

    if (questionsError) {
      console.error('Error fetching questions for PDF export:', questionsError);
      return;
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*, questions!inner(session_id)')
      .eq('questions.session_id', session.id);

    if (votesError) {
      console.error('Error fetching votes for PDF export:', votesError);
      return;
    }

    const doc = new jsPDF();
    doc.text(`Poll Results: ${session.id}`, 14, 16);
    
    let y = 25;
    questions.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.question_text}`, 14, y);
      y += 7;
      const questionVotes = votes.filter(vote => vote.question_id === q.id);
      const totalVotes = questionVotes.length;
      const tableColumn = ["Option", "Votes", "Percentage"];
      const tableRows = [];

      q.session_options.forEach(o => {
        const count = questionVotes.filter(v => v.selected_option_id === o.id).length;
        const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
        const rowData = [
          o.option_text,
          count,
          `${percentage}%`
        ];
        tableRows.push(rowData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: y,
      });

      y = doc.autoTable.previous.finalY + 10;
    });

    doc.save(`poll-results-${session.id}.pdf`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>
          <input
            type="password"
            placeholder="Enter admin password"
            className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition duration-200"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create New Poll */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">Create New Poll</h2>
              
              <input
                type="text"
                placeholder="Enter custom session name (e.g., 'weekly-meeting')"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customSessionId}
                onChange={(e) => setCustomSessionId(e.target.value)}
              />

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">Question {qIndex + 1}</h3>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={`Enter poll question ${qIndex + 1}`}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={q.question_text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Options:</label>
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex gap-2">
                        <input
                          type="text"
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        />
                        {q.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition duration-200"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addQuestion}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                + Add Another Question
              </button>

              <button 
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition duration-200"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>

            {/* QR Code Display */}
            <div className="space-y-4">
              {qrCodeUrl && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Scan to Vote</h3>
                  <QRCodeDisplay qrCodeUrl={qrCodeUrl} />
                  <p className="text-sm text-gray-600 mt-2">Session Name: {sessionId}</p>
                  <div className="mt-4 space-x-2">
                    <a 
                      href={`/poll/${sessionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-block transition duration-200"
                    >
                      Open Poll
                    </a>
                    <a 
                      href={`/result/${sessionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg inline-block transition duration-200"
                    >
                      View Results
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">All Sessions</h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    Session Name: <span className="font-semibold">{session.id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Questions: {session.questions.length} | Created: {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    session.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {session.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleSessionStatus(session.id, session.is_active)}
                    className={`px-3 py-1 rounded-lg text-sm transition duration-200 ${
                      session.is_active
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {session.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <a 
                    href={`/result/${session.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition duration-200"
                  >
                    Results
                  </a>
                  <button onClick={() => exportToCSV(session)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition duration-200">CSV</button>
                  <button onClick={() => exportToPDF(session)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition duration-200">PDF</button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-gray-500 text-center py-8">No sessions created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
