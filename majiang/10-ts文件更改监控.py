import sys
import time
import logging
from watchdog.observers import Observer
from watchdog.events import LoggingEventHandler, FileSystemEventHandler, FileModifiedEvent
from os.path import *
import time
import colorama
import subprocess as sp
import os

ts_files = join(dirname(abspath(__file__)), '../js')
last_compile = 0


def compile():
    sp.check_call("tsc --build", shell=True, cwd=dirname(ts_files), )


class MyHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global last_compile
        if type(event) == FileModifiedEvent and event.src_path.endswith('.ts'):
            if time.time() - last_compile < 1:
                return
            last_compile = time.time()
            print(f"${event.src_path}发生变动，正在重新编译")
            compile()
            print(colorama.Fore.GREEN + '重新编译成功！' + colorama.Fore.RESET)


if __name__ == "__main__":
    compile()
    observer = Observer()
    observer.schedule(MyHandler(), ts_files, recursive=False)
    observer.start()
    observer.join()
