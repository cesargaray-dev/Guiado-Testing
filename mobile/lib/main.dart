import 'package:flutter/material.dart';
import 'task.dart';
import 'task_list_panel.dart';

void main() {
  runApp(const TaskManagerApp());
}

class TaskManagerApp extends StatelessWidget {
  const TaskManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Task Manager',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const AuthenticationWrapper(),
    );
  }
}

class AuthenticationWrapper extends StatefulWidget {
  const AuthenticationWrapper({super.key});

  @override
  State<AuthenticationWrapper> createState() => _AuthenticationWrapperState();
}

class _AuthenticationWrapperState extends State<AuthenticationWrapper> {
  bool _isSignedIn = false;
  String? _currentUserEmail;

  void _login(String email) {
    setState(() {
      _isSignedIn = true;
      _currentUserEmail = email;
    });
  }

  void _logout() {
    setState(() {
      _isSignedIn = false;
      _currentUserEmail = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isSignedIn) {
      return LoginScreen(onLogin: _login);
    }
    return TasksHomeScreen(
      userEmail: _currentUserEmail ?? 'User',
      onLogout: _logout,
    );
  }
}

class LoginScreen extends StatefulWidget {
  final ValueChanged<String> onLogin;

  const LoginScreen({super.key, required this.onLogin});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      widget.onLogin(_emailController.text.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Task Manager Login')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  key: const Key('email-field'),
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('password-field'),
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter password';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    key: const Key('login-button'),
                    onPressed: _submit,
                    child: const Text('Log In'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class TasksHomeScreen extends StatefulWidget {
  final String userEmail;
  final VoidCallback onLogout;

  const TasksHomeScreen({
    super.key,
    required this.userEmail,
    required this.onLogout,
  });

  @override
  State<TasksHomeScreen> createState() => _TasksHomeScreenState();
}

class _TasksHomeScreenState extends State<TasksHomeScreen> {
  final List<Task> _tasks = [];
  bool _loading = false;
  String? _errorMessage;

  void _openCreateTaskDialog() {
    final titleController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Task'),
        content: TextField(
          key: const Key('task-title-field'),
          controller: titleController,
          decoration: const InputDecoration(
            hintText: 'Enter task title',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            key: const Key('save-task-button'),
            onPressed: () {
              final text = titleController.text.trim();
              if (text.isNotEmpty) {
                setState(() {
                  _tasks.add(Task(
                    id: 'task-${DateTime.now().millisecondsSinceEpoch}',
                    title: text,
                    completed: false,
                  ));
                });
                Navigator.of(ctx).pop();
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _toggleComplete(int index) {
    setState(() {
      final task = _tasks[index];
      _tasks[index] = Task(
        id: task.id,
        title: '${task.title} (Completed)',
        completed: !task.completed,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks'),
        actions: [
          IconButton(
            key: const Key('logout-button'),
            tooltip: 'Logout',
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogout,
          ),
        ],
      ),
      body: TaskListPanel(
        loading: _loading,
        tasks: _tasks.map((t) => t.title).toList(),
        errorMessage: _errorMessage,
        onRetry: () {
          setState(() {
            _errorMessage = null;
          });
        },
        onToggleComplete: _toggleComplete,
      ),
      floatingActionButton: FloatingActionButton(
        key: const Key('add-task-button'),
        onPressed: _openCreateTaskDialog,
        tooltip: 'Add Task',
        child: const Icon(Icons.add),
      ),
    );
  }
}
