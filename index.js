const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  compression({
    level: 5,
    threshold: 0,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  console.log(
    `[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${res.statusCode
    }`,
  );
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Favicon
app.get('/favicon.:ext', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Dashboard login (frontend parsing tidak diubah)
app.all('/player/login/dashboard', function (req, res) {
  const tData = {};
  try {
    const uData = JSON.stringify(req.body).split('"')[1].split('\\n');
    const uName = uData[0].split('|');
    const uPass = uData[1].split('|');
    for (let i = 0; i < uData.length - 1; i++) {
      const d = uData[i].split('|');
      tData[d[0]] = d[1];
    }
    if (uName[1] && uPass[1]) {
      res.redirect('/player/growid/login/validate');
    }
  } catch (why) {
    console.log(`Warning: ${why}`);
  }

  res.render(__dirname + '/public/html/dashboard.ejs', { data: tData });
});

// Validasi login → generate token + accountAge: 2
app.all('/player/growid/login/validate', (req, res) => {
  const _token = req.body._token || '';
  const growId = req.body.growId || '';
  const password = req.body.password || '';

  const token = Buffer.from(
    `_token=${_token}&growId=${growId}&password=${password}`
  ).toString('base64');

  res.send(
    `{"status":"success","message":"Account Validated.","token":"${token}","url":"","accountType":"growtopia","accountAge":2}`
  );
});

// Check token → validasi dan refresh token + accountAge: 2
app.all('/player/growid/checktoken', (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = Buffer.from(refreshToken, 'base64').toString('utf-8');
    if (typeof decoded !== 'string' && !decoded.startsWith('growId=') && !decoded.includes('passwords=')) return res.render(__dirname + '/public/html/dashboard.ejs');
    res.json({
      status: 'success',
      message: 'Account Validated.',
      token: refreshToken,
      url: '',
      accountType: 'growtopia',
      accountAge: 2
    });
  } catch (error) {
    console.log("Redirecting to player login dashboard");
    res.render(__dirname + '/public/html/dashboard.ejs');
  }
});

// Root
app.get('/', function (req, res) {
  res.send(`
<!DOCTYPE html>
<html lang="en" data-theme="black">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NovaStore - GTPS Services</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- DaisyUI -->
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css" rel="stylesheet" type="text/css" />
    
    <!-- Bootstrap CSS (using only grid/utilities to avoid conflict, but user asked for it) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap-grid.min.css" rel="stylesheet">
    
    <!-- Pixel Font -->
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'VT323', monospace;
            background-color: #0d1117;
            color: #00ff41;
            overflow-x: hidden;
        }
        
        .terminal-window {
            background: #161b22;
            border: 2px solid #30363d;
            border-radius: 6px;
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.1);
        }

        .terminal-header {
            background: #21262d;
            padding: 8px 16px;
            border-bottom: 1px solid #30363d;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }

        .scanline {
            width: 100%;
            height: 100px;
            z-index: 10;
            background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0, 255, 65, 0.04) 50%, rgba(0,0,0,0) 100%);
            opacity: 0.1;
            position: absolute;
            bottom: 100%;
            animation: scanline 10s linear infinite;
            pointer-events: none;
        }

        @keyframes scanline {
            0% { bottom: 100%; }
            100% { bottom: -100%; }
        }

        .glitch-text {
            position: relative;
        }

        .glitch-text::before,
        .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }

        .glitch-text::before {
            left: 2px;
            text-shadow: -1px 0 #ff00c1;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
        }

        .glitch-text::after {
            left: -2px;
            text-shadow: -1px 0 #00fff9;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim2 5s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
            0% { clip: rect(34px, 9999px, 11px, 0); }
            20% { clip: rect(78px, 9999px, 93px, 0); }
            40% { clip: rect(12px, 9999px, 5px, 0); }
            60% { clip: rect(56px, 9999px, 23px, 0); }
            80% { clip: rect(89px, 9999px, 2px, 0); }
            100% { clip: rect(4px, 9999px, 67px, 0); }
        }

        @keyframes glitch-anim2 {
            0% { clip: rect(2px, 9999px, 87px, 0); }
            20% { clip: rect(54px, 9999px, 12px, 0); }
            40% { clip: rect(9px, 9999px, 34px, 0); }
            60% { clip: rect(76px, 9999px, 45px, 0); }
            80% { clip: rect(23px, 9999px, 98px, 0); }
            100% { clip: rect(65px, 9999px, 11px, 0); }
        }

        .cursor {
            display: inline-block;
            width: 10px;
            height: 1.2em;
            background-color: #00ff41;
            animation: blink 1s step-end infinite;
            vertical-align: bottom;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        .service-card {
            transition: all 0.3s ease;
            border: 1px solid #30363d;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
            border-color: #00ff41;
            box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
        }
    </style>
</head>
<body class="min-h-screen flex flex-col">

    <div class="scanline"></div>

    <!-- Hero Section -->
    <div class="hero min-h-[70vh] bg-base-200 relative overflow-hidden">
        <div class="hero-content text-center z-10">
            <div class="max-w-3xl">
                <div class="terminal-window mb-8 text-left">
                    <div class="terminal-header">
                        <div class="dot dot-red"></div>
                        <div class="dot dot-yellow"></div>
                        <div class="dot dot-green"></div>
                        <span class="ml-4 text-gray-400 text-sm">root@novastore:~</span>
                    </div>
                    <div class="p-6 font-mono text-lg">
                        <p class="mb-2"><span class="text-green-500">root@novastore:~$</span> ./init_services.sh</p>
                        <p class="mb-2 text-blue-400">Initializing NovaStore GTPS Services...</p>
                        <p class="mb-2">[OK] Loading LoginURL</p>
                        <p class="mb-2">[OK] Loading DDoS Protection...</p>
                        <p class="mb-2">[OK] Loading 24/7 Support...</p>
                        <p class="mb-4 text-yellow-400">Ready to deploy your dream server!</p>
                        <p><span class="text-green-500">root@novastore:~$</span> <span class="cursor"></span></p>
                    </div>
                </div>
                
                <h1 class="text-5xl font-bold mb-6 glitch-text text-white" data-text="LEVEL UP YOUR GTPS">LEVEL UP YOUR GTPS</h1>
                <p class="py-6 text-xl text-gray-300">
                    Premium hosting, custom scripts, and top-tier security for your Growtopia Private Server. 
                    Built by developers, for developers.
                </p>
                <button class="btn btn-primary btn-lg rounded-none border-2 border-primary hover:bg-primary hover:text-black transition-all">
                    &gt; START_PROJECT
                </button>
            </div>
        </div>
        
        <!-- Pixel Background Decoration -->
        <div class="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" 
             style="background-image: radial-gradient(#00ff41 1px, transparent 1px); background-size: 30px 30px;">
        </div>
    </div>

   
    <!-- Stats Section (Bootstrap Grid) -->
    <div class="bg-neutral text-neutral-content py-12 border-y border-gray-700">
        <div class="container mx-auto">
            <div class="row text-center">
                <div class="col-md-4 mb-4 md:mb-0">
                    <div class="stat-value text-4xl font-bold text-primary">500+</div>
                    <div class="stat-title text-xl">Servers Deployed</div>
                </div>
                <div class="col-md-4 mb-4 md:mb-0">
                    <div class="stat-value text-4xl font-bold text-primary">10k+</div>
                    <div class="stat-title text-xl">Happy Players</div>
                </div>
                <div class="col-md-4">
                    <div class="stat-value text-4xl font-bold text-primary">24/7</div>
                    <div class="stat-title text-xl">Active Support</div>
                </div>
            </div>
        </div>
    </div>

   

</body>
</html>
  `);
});

// Start server
app.listen(5000, function () {
  console.log('Listening on port 5000');
});
