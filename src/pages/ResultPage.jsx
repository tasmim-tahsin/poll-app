import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ResultPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    fetchData();
    
    const subscription = supabase
      .channel('votes_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'votes'
        }, 
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sessionId]);

  const fetchData = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*, session_options(*)')
        .eq('session_id', sessionId)
        .order('question_order');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      await fetchVotes();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select(`
          *,
          questions!inner(session_id),
          session_options (
            option_text,
            option_order
          )
        `)
        .eq('questions.session_id', sessionId);

      if (votesError) throw votesError;
      setVotes(votesData || []);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const getVoteResults = (question) => {
    const questionVotes = votes.filter(vote => vote.question_id === question.id);
    const results = question.session_options.map(option => ({
      id: option.id,
      text: option.option_text,
      count: questionVotes.filter(vote => vote.selected_option_id === option.id).length,
      percentage: 0
    }));

    const totalVotes = results.reduce((sum, result) => sum + result.count, 0);
    
    return {
      results: results.map(result => ({
        ...result,
        percentage: totalVotes > 0 ? ((result.count / totalVotes) * 100).toFixed(1) : 0
      })),
      totalVotes
    };
  };

  const getChartData = (results) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    return {
      labels: results.map(r => r.text),
      datasets: [
        {
          label: 'Votes',
          data: results.map(r => r.count),
          backgroundColor: colors.slice(0, results.length),
          borderColor: colors.slice(0, results.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    } : undefined,
  });

  const getVotersList = () => {
    return votes
      .filter(vote => !vote.is_anonymous && vote.voter_name)
      .map(vote => ({
        name: vote.voter_name,
        option: vote.session_options?.option_text || 'Unknown',
        timestamp: new Date(vote.created_at).toLocaleString()
      }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Session Not Found</h1>
          <p className="text-gray-600">This poll session does not exist.</p>
        </div>
      </div>
    );
  }

  const votersList = getVotersList();

  const exportToCSV = () => {
    const allResults = [];
    questions.forEach(q => {
      const { results } = getVoteResults(q);
      results.forEach(r => {
        allResults.push({
          question: q.question_text,
          option: r.text,
          votes: r.count
        });
      });
    });
    const csv = Papa.unparse(allResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `poll-results-${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Poll Results: ${sessionId}`, 14, 16);
    
    let y = 25;
    questions.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.question_text}`, 14, y);
      y += 7;
      const { results } = getVoteResults(q);
      const tableColumn = ["Option", "Votes", "Percentage"];
      const tableRows = [];

      results.forEach(r => {
        const rowData = [
          r.text,
          r.count,
          `${r.percentage}%`
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

    doc.save(`poll-results-${sessionId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Poll Results: {sessionId}</h1>
            <div className="mt-4 flex justify-center items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {session.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-4 flex justify-center items-center space-x-2">
              <button onClick={exportToCSV} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200">Export as CSV</button>
              <button onClick={exportToPDF} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200">Export as PDF</button>
            </div>
          </div>
        </div>

        {questions.map((question, index) => {
          const { results, totalVotes } = getVoteResults(question);
          const chartData = getChartData(results);
          return (
            <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{index + 1}. {question.question_text}</h2>
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Total Votes: {totalVotes}
                </span>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Results Summary */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Summary</h3>
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div key={result.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">{result.text}</span>
                          <span className="text-sm text-gray-600">
                            {result.count} votes ({result.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {totalVotes === 0 && (
                      <p className="text-gray-500 text-center py-8">No votes yet for this question</p>
                    )}
                  </div>
                </div>

                {/* Chart Visualization */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Visualization</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded-lg text-sm transition duration-200 ${
                          chartType === 'bar'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Bar
                      </button>
                      <button
                        onClick={() => setChartType('pie')}
                        className={`px-3 py-1 rounded-lg text-sm transition duration-200 ${
                          chartType === 'pie'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Pie
                      </button>
                    </div>
                  </div>
                  
                  {totalVotes > 0 ? (
                    <div className="h-80">
                      {chartType === 'bar' ? (
                        <Bar data={chartData} options={chartOptions(question.question_text)} />
                      ) : (
                        <Pie data={chartData} options={chartOptions(question.question_text)} />
                      )}
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      <p>No data to display yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Voters List */}
        {votersList.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Voters ({votersList.length} named votes)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {votersList.map((voter, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {voter.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {voter.option}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {voter.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={`/poll/${sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              Open Poll
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              Refresh Results
            </button>
            <a
              href="/admin"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              Admin Panel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
