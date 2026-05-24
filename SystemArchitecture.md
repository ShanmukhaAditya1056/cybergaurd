# CyberGuard AI - System Architecture

## Overview
CyberGuard AI is a comprehensive security application designed to detect and prevent various cyber threats, including phishing, malware, data breaches, insecure Wi-Fi networks, and weak passwords. The system adopts a modular, service-oriented architecture comprised of four primary components:

1. **Client (Frontend Web App)**
2. **Server (Backend API)**
3. **ML Service (Machine Learning Engine)**
4. **Desktop Agent (Local Scanner)**

---

## 1. Client (Frontend Web App)
- **Technology Stack:** React.js, TailwindCSS
- **Responsibility:** The Client provides the user interface for monitoring the system's security status. It acts as the presentation layer, visualizing data from the backend such as real-time alerts, detailed scan results, and overall dashboard metrics.
- **Key Features:** User-friendly dashboards, responsive design (TailwindCSS), and real-time interaction with the backend API.

## 2. Server (Backend API)
- **Technology Stack:** Node.js, Express.js, MongoDB
- **Responsibility:** The Server serves as the central orchestration hub of the application. It provides RESTful API endpoints that the Client and Desktop Agent consume to perform operations and store data.
- **Security Features:** Implements Helmet for secure HTTP headers, `express-mongo-sanitize` for NoSQL injection protection, CORS for controlled access, and rate limiting to prevent API abuse.
- **Key API Routes:**
  - `/api/phishing`: Logic for phishing URL detection.
  - `/api/malware`: Endpoints for malware analysis.
  - `/api/breach`: Data breach verification checks.
  - `/api/wifi`: Wi-Fi network security scanning.
  - `/api/password`: Password strength evaluation and breach checks.

## 3. ML Service (Machine Learning Engine)
- **Technology Stack:** Python, Machine Learning Libraries (e.g., scikit-learn, TensorFlow/PyTorch)
- **Responsibility:** This microservice provides advanced threat detection using trained machine learning models. It receives inputs (such as URLs or file characteristics) from the Server and returns probability scores indicating the likelihood of malicious intent.
- **Key Components:** 
  - `app.py`: An HTTP server (likely Flask or FastAPI) serving model predictions.
  - `train_malware.py` & `train_phishing.py`: Scripts used to train the machine learning models.

## 4. Desktop Agent
- **Technology Stack:** Node.js (`scanner.js`)
- **Responsibility:** The Desktop Agent runs locally on the user's operating system. It is responsible for performing deep system scans (e.g., file system, local network) that a web browser cannot execute directly due to security sandboxing. 
- **Operation:** It gathers local security data and communicates its findings back to the central Server API.

---

## Complete Data Flow

1. **Initiation:** A user requests a security scan or accesses the dashboard via the **Client**.
2. **Request Handling:** The **Client** sends an HTTP request to the **Server** API.
3. **Local Data Collection:** For system-level operations, the **Desktop Agent** performs local scans and securely transmits the gathered data to the **Server**.
4. **Intelligent Analysis:** If the request involves analyzing potentially malicious URLs or files, the **Server** forwards this data to the **ML Service**. The ML Service runs its inference models and returns a threat score.
5. **Persistence:** The **Server** consolidates all data (from the Agent and ML Service), updates the state, and stores the results (Alerts, ScanResults, BreachLogs) securely in **MongoDB**.
6. **Delivery:** The **Server** responds to the **Client** with the final, consolidated security findings, which are then rendered on the user's dashboard.
