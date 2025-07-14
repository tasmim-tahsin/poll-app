import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const PollPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [options, setOptions] = useState([]);
  const [name, setName] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (!sessionData.is_active) {
        alert('This poll session is no longer active.');
        return;
      }

      setSession(sessionData);

      // Fetch session options
      const { data: optionsData, error: optionsError } = await supabase
        .from('session_options')
        .select('*')
        .eq('session_id', sessionId)
        .order('option_order');

      if (optionsError) throw optionsError;

      setOptions(optionsData || []);
    } catch (error) {
      console.error('Error fetching session data:', error);
      alert('Error loading poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      alert('Please select an option');
      return;
    }

    if (!isAnonymous && !name.trim()) {
      alert('Please enter your name or choose to vote anonymously');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('votes')
        .insert([{
          session_id: sessionId,
          voter_name: isAnonymous ? null : name.trim(),
          selected_option_id: selectedOption,
          is_anonymous: isAnonymous
        }]);

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Error submitting vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Poll Not Found</h1>
          <p className="text-gray-600">This poll session does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your vote has been submitted successfully.</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/result/${sessionId}`)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              View Live Results
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              Vote Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{session.question}</h1>
            <p className="text-gray-600">Select your answer below</p>
          </div>

          <div className="space-y-6">
            {/* Voter Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Vote anonymously</span>
                </label>
              </div>

              {!isAnonymous && (
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </div>

            {/* Poll Options */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700 mb-3">Choose your answer:</label>
              {options.map((option) => (
                <label
                  key={option.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                    selectedOption === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="pollOption"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-lg text-gray-800">{option.option_text}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedOption}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg text-lg font-medium transition duration-200"
            >
              {submitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>

          {/* Session Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Session created: {new Date(session.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollPage;
