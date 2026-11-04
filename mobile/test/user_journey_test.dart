import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:task_manager_mobile/main.dart' as app;

void main() {
  group('Section 7 & Practice Exercise 7: Complete User Journey', () {
    testWidgets('user can sign in, create a task, mark it complete, and log out', (tester) async {
      // 1. Launch application
      app.main();
      await tester.pumpAndSettle();

      // 2. Fill login form
      expect(find.byKey(const Key('email-field')), findsOneWidget);
      await tester.enterText(find.byKey(const Key('email-field')), 'tester@example.test');
      await tester.enterText(find.byKey(const Key('password-field')), 'local-test-password');
      await tester.tap(find.byKey(const Key('login-button')));
      await tester.pumpAndSettle();

      // 3. Verify home screen loaded and add a task
      expect(find.text('Tasks'), findsOneWidget);
      await tester.tap(find.byKey(const Key('add-task-button')));
      await tester.pumpAndSettle();

      // 4. Enter task title in dialog and save
      await tester.enterText(find.byKey(const Key('task-title-field')), 'Check release flow');
      await tester.tap(find.byKey(const Key('save-task-button')));
      await tester.pumpAndSettle();

      // 5. Verify task appears
      expect(find.text('Check release flow'), findsOneWidget);

      // --- PRACTICE EXERCISE 7 EXTENSION ---
      // 6. Mark task complete
      final completeButton = find.byKey(const Key('complete-task-0'));
      expect(completeButton, findsOneWidget);
      await tester.tap(completeButton);
      await tester.pumpAndSettle();
      expect(find.text('Check release flow (Completed)'), findsOneWidget);

      // 7. Log out
      final logoutButton = find.byKey(const Key('logout-button'));
      expect(logoutButton, findsOneWidget);
      await tester.tap(logoutButton);
      await tester.pumpAndSettle();

      // 8. Verify login screen appears
      expect(find.byKey(const Key('email-field')), findsOneWidget);
      expect(find.byKey(const Key('password-field')), findsOneWidget);
      expect(find.byKey(const Key('login-button')), findsOneWidget);
      expect(find.text('Task Manager Login'), findsOneWidget);
    });
  });
}
