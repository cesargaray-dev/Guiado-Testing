import 'package:flutter/material.dart';

/// Shows tasks or the current loading, empty, or error state.
class TaskListPanel extends StatelessWidget {
  /// Creates a task list panel.
  const TaskListPanel({
    super.key,
    required this.loading,
    required this.tasks,
    this.errorMessage,
    this.onRetry,
    this.onToggleComplete,
  });

  /// Whether tasks are being loaded.
  final bool loading;

  /// Task titles to display.
  final List<String> tasks;

  /// Optional safe error message.
  final String? errorMessage;

  /// Practice Exercise 5: Retry callback when error occurs.
  final VoidCallback? onRetry;

  /// Optional callback when toggling task state.
  final ValueChanged<int>? onToggleComplete;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(
        child: CircularProgressIndicator(
          semanticsLabel: 'Loading tasks',
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 16),
              // Practice Exercise 5: Retry button
              ElevatedButton.icon(
                key: const Key('retry-button'),
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (tasks.isEmpty) {
      return const Center(
        child: Text('No tasks yet.'),
      );
    }

    return Material(
      type: MaterialType.transparency,
      child: ListView.builder(
        itemCount: tasks.length,
        itemBuilder: (context, index) {
          final task = tasks[index];
          return ListTile(
            key: Key('task-item-$index'),
            title: Text(task),
            trailing: IconButton(
              key: Key('complete-task-$index'),
              icon: const Icon(Icons.check_circle_outline),
              tooltip: 'Mark as complete',
              onPressed: onToggleComplete != null
                  ? () => onToggleComplete!(index)
                  : null,
            ),
          );
        },
      ),
    );
  }
}
