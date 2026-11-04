import 'package:flutter_test/flutter_test.dart';
import 'package:task_manager_mobile/task.dart';

void main() {
  group('Task Model Tests (Section 4 & Practice Exercise 4)', () {
    test('parses a valid task', () {
      final task = Task.fromJson({'id': 'task-1', 'title': 'Plan tests'});
      expect(task.id, 'task-1');
      expect(task.title, 'Plan tests');
      expect(task.completed, false);
    });

    test('rejects an empty title', () {
      expect(
        () => Task.fromJson({'id': 'task-1', 'title': ' '}),
        throwsFormatException,
      );
    });

    // Practice Exercise 4: Unit test for missing ID
    test('rejects a task when id is missing or null', () {
      expect(
        () => Task.fromJson({'title': 'Valid Title'}),
        throwsFormatException,
      );
      expect(
        () => Task.fromJson({'id': null, 'title': 'Valid Title'}),
        throwsFormatException,
      );
    });

    // Practice Exercise 4: Unit test for valid title at maximum allowed length (120 chars)
    test('parses a task with title at maximum allowed length (120 characters)', () {
      final maxTitle = 'A' * 120;
      final task = Task.fromJson({'id': 'task-max', 'title': maxTitle});
      expect(task.id, 'task-max');
      expect(task.title, maxTitle);
      expect(task.title.length, 120);
    });

    test('converts task to JSON map correctly', () {
      const task = Task(id: 'task-1', title: 'Plan tests', completed: true);
      final json = task.toJson();
      expect(json['id'], 'task-1');
      expect(json['title'], 'Plan tests');
      expect(json['completed'], true);
    });
  });
}
