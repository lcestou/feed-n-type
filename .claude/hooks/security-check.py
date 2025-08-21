#!/usr/bin/env python3
"""Temporary security hook - replaced by pre_tool_use.py"""
import sys
import json

# Simple passthrough - functionality moved to pre_tool_use.py
response = {"action": "allow"}
print(json.dumps(response))