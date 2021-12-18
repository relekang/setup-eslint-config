/* eslint-disable @typescript-eslint/no-explicit-any */
import { ListrEvent, ListrEventType, ListrRenderer } from "listr2";
import { Task } from "listr2/dist/lib/task";
import debug from "debug";

export class DebugRenderer implements ListrRenderer {
  public static nonTTY = true;
  public static rendererOptions: never;
  public static rendererTaskOptions: never;

  logger = {
    fail: debug("setup-eslint-config:listr:fail"),
    start: debug("setup-eslint-config:listr:start"),
    title: debug("setup-eslint-config:listr:title"),
    skip: debug("setup-eslint-config:listr:skip"),
    success: debug("setup-eslint-config:listr:success"),
    data: debug("setup-eslint-config:listr:data"),
    retry: debug("setup-eslint-config:listr:retry"),
    rollback: debug("setup-eslint-config:listr:rollback"),
  };

  constructor(
    public tasks: Task<any, typeof DebugRenderer>[],
    public options: typeof DebugRenderer["rendererOptions"]
  ) {}

  public render(): void {
    this.verboseRenderer(this.tasks);
  }

  public end(): void {
    debug("setup-eslint-config:listr")("end");
  }

  // verbose renderer multi-level
  private verboseRenderer(tasks: Task<any, typeof DebugRenderer>[]): void {
    return tasks?.forEach((task) => {
      task.subscribe(
        // eslint-disable-next-line complexity
        (event: ListrEvent) => {
          if (task.isEnabled()) {
            const taskTitle = task.hasTitle()
              ? task.title
              : "Task without title.";

            if (event.type === ListrEventType.SUBTASK && task.hasSubtasks()) {
              this.verboseRenderer(
                task.subtasks as Task<any, typeof DebugRenderer>[]
              );
            } else if (event.type === ListrEventType.STATE) {
              if (task.hasTitle()) {
                if (task.isPending()) {
                  this.logger.start(taskTitle);
                } else if (task.isCompleted()) {
                  this.logger.success(
                    (taskTitle || "") +
                      " " +
                      (task.message?.duration?.toString() || "")
                  );
                }
              }
            } else if (event.type === ListrEventType.DATA && !!event.data) {
              this.logger.data(String(event.data));
            } else if (event.type === ListrEventType.TITLE) {
              this.logger.title(String(event.data));
            } else if (event.type === ListrEventType.MESSAGE) {
              if (event.data?.error) {
                // error message
                this.logger.fail(String(event.data.error));
              } else if (event.data?.skip) {
                // skip message
                this.logger.skip(String(event.data.skip));
              } else if (event.data?.rollback) {
                // rollback message
                this.logger.rollback(String(event.data.rollback));
              } else if (event.data?.retry) {
                // inform of retry count
                this.logger.retry(
                  `[${event.data.retry.count}] ` + String(taskTitle)
                );
              }
            }
          }
        },
        /* istanbul ignore next */ (err) => {
          this.logger.fail(err);
        }
      );
    });
  }
}
