# Live Link

https://my-poll-app.netlify.app/

# Admin password
********

# PollApp - Real-time Polling Application

<a href="https://ibb.co/kV5HC6Fb"><img src="https://i.ibb.co/gbmjKFCq/130shots-so.png" alt="130shots-so" border="0"></a>

## 🚀 Features

### 🎯 Core Functionality
- **Real-time polling** with live results visualization
- **Admin dashboard** for creating and managing polls
- **QR code integration** for easy poll access
- **Anonymous voting** with device tracking
- **Session management** with activation/deactivation

### 👨‍💻 Admin Features
- 🔐 **Password-protected admin panel and poll questions**
- 📝 **Create polls** with multiple question types
- 🎨 **Custom theming** for each session
- 📊 **View live results** with interactive charts
- 📥 **Export results** to CSV/PDF formats
- 🔄 **Real-time updates** on participant count

### 👥 User Features
- 📝 **Create polls** with multiple question types
- 🔐 **Password-protected** poll questions
- 📱 **Mobile-friendly** voting interface
- 🔍 **View live results** after voting
- 📊 **Interactive visualizations** of poll data
- 🏷 **Anonymous participation** without login
- 📥 **Export results** to CSV/PDF formats

## 🛠 Technologies Used

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Supabase (Database + Authentication)
- **Realtime Updates**: Supabase Realtime API
- **Charts**: Chart.js
- **QR Codes**: react-qr-code
- **PDF Export**: jsPDF
- **Deployment**: Netlify

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tasmim-tahsin/poll-app.git
   cd poll-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_APP_SUPABASE_URL=your-supabase-url
   VITE_APP_SUPABASE_KEY=your-supabase-key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## 🔧 Configuration

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema provided in `database_schema.sql`
3. Enable Row Level Security (RLS) with appropriate policies
4. Enable the Realtime API for the tables you want to sync

### Admin Access
Default admin password is set to `admin123` (change this in `AdminPage.jsx` for production)

## 🚀 Deployment

### Netlify Deployment
1. Push your code to a GitHub repository
2. Create a new site in Netlify and connect your GitHub repo
3. Set these build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add environment variables from your `.env` file
5. Deploy!

## 📂 Project Structure

```
src/
├── components/       # React components
├── pages/            # Page components
├── utils/            # Utility functions
├── hooks/            # Custom React hooks
├── styles/           # CSS/Tailwind files
└── App.js            # Main application entry
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✉️ Contact

For questions or feedback, please contact [tahsinniyan@gmail.com].
