# Scout User Guide

Scout is your AI-powered assistant for finding information in Arrow's company documents. This guide shows you how to get the most out of Scout.

## 🚀 Quick Start

### What is Scout?
Scout is a Slack bot that helps you find answers from company documents using natural language. Just ask a question, and Scout searches through uploaded documents to provide accurate, cited responses.

### How to Access Scout
- **In Slack channels**: Mention `@scout` followed by your question
- **Direct message**: Send a DM directly to the Scout bot
- **Web interface**: Upload documents at `http://localhost:3000`

## 💬 Using Scout in Slack

### Basic Usage

#### Mention Scout in Channels
```
@scout What's our vacation policy?
@scout How do I submit an expense report?
@scout What are the office hours?
scout When is the next company meeting?
```

#### Direct Messages
Open a DM with Scout and ask any question:
```
What's the process for requesting time off?
How do I access the employee handbook?
What benefits do we offer?
```

### Advanced Query Tips

#### Be Specific
❌ **Less effective**: `@scout benefits`
✅ **More effective**: `@scout What health insurance benefits do full-time employees get?`

#### Use Natural Language
❌ **Less effective**: `vacation policy days allowed`
✅ **More effective**: `@scout How many vacation days am I allowed per year?`

#### Include Context
❌ **Less effective**: `@scout How do I do this?`
✅ **More effective**: `@scout How do I submit a reimbursement for travel expenses?`

### Understanding Scout's Responses

Scout provides responses in a structured format:

#### Response Components
1. **Header**: Shows Scout's name and mode (Live/Demo)
2. **Your Question**: Repeats your query for clarity
3. **Answer**: Detailed response with relevant information
4. **Sources**: Documents referenced (when available)
5. **Action Buttons**: Quick actions and feedback options
6. **Metadata**: Timestamp and system status

#### Example Response Structure
```
🤖 Scout Knowledge Assistant (Live)

Your question: "What's our vacation policy?"

Based on company documentation, full-time employees receive:
• 15 vacation days annually for first 2 years
• 20 vacation days annually after 2+ years
• Additional personal days and sick leave available
• Vacation requests require 2-week advance notice

📚 Sources referenced: Employee Handbook 2024, HR Policy Guide

[Action Buttons: 👍 Helpful | 🔄 Ask Follow-up | 📧 Share Response]

✅ Live Response - Powered by OpenAI Assistant
🕐 December 6, 2024, 3:45 PM
```

## 📁 Document Upload Guide

### Accessing the Web Interface
1. Open your web browser
2. Navigate to `http://localhost:3000` (or your configured URL)
3. You'll see the Scout File Upload Dashboard

### Uploading Documents

#### Step-by-Step Process
1. **Select File**: Click "Choose File" and select your document
2. **Add Description**: Write a clear description of what the document contains
3. **Upload**: Click "Upload File" button
4. **Confirmation**: You'll see a success message with file details

#### Supported File Types
- **PDF files** (`.pdf`) - Company policies, handbooks, reports
- **Text files** (`.txt`) - Procedures, guidelines, notes  
- **CSV files** (`.csv`) - Data, employee lists, budgets
- **Word documents** (`.docx`) - Policies, procedures, templates

#### File Requirements
- **Maximum size**: 10MB per file
- **File naming**: Original names preserved with timestamp prefix
- **Description required**: Must provide meaningful description

### Writing Good Descriptions

#### Best Practices
✅ **Good descriptions**:
- "Employee handbook covering vacation, benefits, and workplace policies"
- "Q4 2024 expense reporting procedures and approval workflow"  
- "IT security guidelines for remote work and data protection"
- "New employee onboarding checklist and required forms"

❌ **Poor descriptions**:
- "Document"
- "File"
- "Important stuff"
- "Read this"

#### Description Tips
1. **Be specific**: Include document type, topic, and scope
2. **Use keywords**: Include terms people might search for
3. **Add context**: Mention department, date, or purpose
4. **Keep concise**: 1-2 sentences maximum

## 🎛️ Features and Capabilities

### Smart Search Features

#### Natural Language Processing
Scout understands conversational queries:
- "How much vacation time do I get?"
- "What's the process for getting promoted?"
- "Where can I find the IT support contact info?"

#### Context Awareness
Scout maintains context within conversations:
```
User: "What's our remote work policy?"
Scout: [Provides remote work information]
User: "What about for international travel?"
Scout: [Understands you're asking about remote work while traveling]
```

#### Multi-Document Search
Scout searches across all uploaded documents simultaneously and combines relevant information from multiple sources.

### Response Types

#### Standard Responses
- Detailed answers with bullet points
- Source citations
- Relevant context and examples

#### Help Responses
Type "help" or "how to use scout" to get usage instructions:
```
@scout help
```

#### Error Handling
Scout provides helpful messages when:
- No relevant information is found
- Questions are unclear
- System issues occur

### Interactive Features

#### Action Buttons
Every response includes interactive buttons:
- **👍 Helpful**: Mark response as useful
- **🔄 Ask Follow-up**: Continue the conversation  
- **📧 Share Response**: Share with colleagues
- **📁 View All Documents**: See what's in the knowledge base

#### Follow-up Questions
You can ask related questions in the same thread:
```
@scout What's our vacation policy?
[Scout responds with vacation information]

How do I request vacation time?
[Scout provides request process]
```

## 🔍 Tips for Best Results

### Query Optimization

#### Use Specific Keywords
Include relevant terms from your documents:
- Department names (HR, IT, Finance)
- Process names (onboarding, reimbursement, review)
- Policy types (vacation, remote work, expense)

#### Ask Complete Questions
Instead of fragments, ask full questions:
❌ `health benefits`
✅ `What health benefits are available to new employees?`

#### Be Patient
Scout may take a few seconds to search through documents and generate comprehensive responses.

### Getting Help

#### Built-in Help
```
@scout help
@scout how do I use you?
@scout what can you do?
```

#### Common Commands
- `@scout` + your question (in channels)
- Direct message with question (in DMs)
- Visit web interface to upload documents

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Scout Isn't Responding
1. **Check mentions**: Make sure you used `@scout`
2. **Try DM**: Send a direct message instead
3. **Wait briefly**: Scout may be processing your request
4. **Simplify query**: Try a shorter, clearer question

#### No Relevant Information Found
1. **Rephrase question**: Try different keywords
2. **Be more specific**: Add context to your question
3. **Check documents**: Verify relevant docs are uploaded
4. **Try broader terms**: Use general keywords first

#### Unclear Responses
1. **Ask follow-up**: Request clarification or more details
2. **Be more specific**: Narrow down your question
3. **Use examples**: Ask for specific scenarios or examples

### Getting Additional Help

#### Self-Service Options
- Use `@scout help` for usage instructions
- Try rephrasing your questions
- Check the web interface for uploaded documents

#### Support Channels
- Contact your IT department
- Ask colleagues who use Scout regularly
- Check internal documentation or wiki

## 📈 Advanced Usage

### Power User Tips

#### Batch Questions
You can ask multiple related questions:
```
@scout I'm a new employee. What do I need to know about:
1. Vacation policy
2. Health benefits enrollment
3. IT equipment setup
4. First week schedule
```

#### Department-Specific Queries
Be specific about your department or role:
```
@scout As a software engineer, what's the code review process?
@scout What HR policies apply to remote employees?
```

#### Process-Oriented Questions
Ask about workflows and procedures:
```
@scout Walk me through the expense reimbursement process
@scout What's the step-by-step procedure for requesting equipment?
```

### Integration Workflows

#### Document Management
1. **Regular uploads**: Keep documents current
2. **Clear descriptions**: Help Scout understand content
3. **Organized approach**: Upload related documents together

#### Team Usage
- Share useful responses with team members
- Encourage consistent document uploads
- Use Scout for team onboarding and training

## 🔒 Privacy and Security

### What Scout Knows
- Content of uploaded company documents
- Questions you ask and responses provided
- Basic usage patterns and timestamps

### What Scout Doesn't Store
- Personal conversations unrelated to work
- Information from private channels (unless invited)
- Data from external systems or personal documents

### Data Handling
- All data stays within your organization's systems
- Responses are based only on uploaded documents
- No personal information is shared externally

---

**Questions about Scout?** Ask `@scout help` or contact your IT team for additional support!