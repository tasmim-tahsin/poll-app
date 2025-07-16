import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const CreatePollPage = () => {
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', ''] }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (!sessionId.trim() || questions.some(q => !q.question_text.trim() || q.options.some(opt => !opt.trim()))) {
      alert('Please fill in the session name, all questions, and all options');
      return;
    }

    setLoading(true);
    try {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{ id: sessionId.trim(), user_password: password.trim() || null }])
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

      alert('Poll created successfully!');
      navigate(`/poll/${sessionData.id}`);
      
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Create a New Poll</h1>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter a unique name for your poll"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />

            <input
              type="password"
              placeholder="Set a password (optional)"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePollPage;
