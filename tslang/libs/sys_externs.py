import sys
import os
import platform

intent = sys.argv[1]

if intent == "SystemShutdown":
    os.system("shutdown /s /t 1")
elif intent == "SystemStandardInit":
    ossys = sys.platform
    osmch = platform.uname().machine
    print(f"{ossys},{osmch}")