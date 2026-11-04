import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:task_manager_mobile/task_list_panel.dart';

void main() {
  group('TaskListPanel Widget Tests (Section 5 & Practice Exercises)', () {
    testWidgets('shows loading state', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: TaskListPanel(loading: true, tasks: []),
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows empty state', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: TaskListPanel(loading: false, tasks: []),
        ),
      );
      expect(find.text('No tasks yet.'), findsOneWidget);
    });

    testWidgets('shows error state', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: TaskListPanel(
            loading: false,
            tasks: [],
            errorMessage: 'Could not load tasks.',
          ),
        ),
      );
      expect(find.text('Could not load tasks.'), findsOneWidget);
    });

    testWidgets('shows task data', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: TaskListPanel(
            loading: false,
            tasks: ['Plan tests'],
          ),
        ),
      );
      expect(find.text('Plan tests'), findsOneWidget);
    });

    // Practice Exercise 5: Add a retry button to error state and test callback invoked exactly once
    testWidgets('tapping retry button in error state invokes callback exactly once', (tester) async {
      int retryCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TaskListPanel(
              loading: false,
              tasks: const [],
              errorMessage: 'Network connection failed.',
              onRetry: () {
                retryCount++;
              },
            ),
          ),
        ),
      );

      // Verify retry button is rendered
      final retryButtonFinder = find.byKey(const Key('retry-button'));
      expect(retryButtonFinder, findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);

      // Tap the retry button
      await tester.tap(retryButtonFinder);
      await tester.pump();

      // Verify callback was triggered exactly once
      expect(retryCount, 1);
    });

    // Practice Exercise 11: Usability and accessibility (large text size)
    testWidgets('renders properly with large accessibility text scale without clipping', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2.0)),
            child: const Scaffold(
              body: TaskListPanel(
                loading: false,
                tasks: ['Accessible High Contrast Task Title'],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Accessible High Contrast Task Title'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    // Practice Exercise 12: Device compatibility (Small screen vs Large screen)
    testWidgets('renders cleanly on small screen size (320x568 dp)', (tester) async {
      tester.view.physicalSize = const Size(320, 568);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TaskListPanel(
              loading: false,
              tasks: ['Small Screen Task 1', 'Small Screen Task 2'],
            ),
          ),
        ),
      );

      expect(find.text('Small Screen Task 1'), findsOneWidget);
      expect(find.text('Small Screen Task 2'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}

