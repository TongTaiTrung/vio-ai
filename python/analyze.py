import sys
import json
from pose_detector import analyze

if __name__ == "__main__":
    student_video = sys.argv[1]
    sample_video = sys.argv[2]
    print("Analyzing(...)", file=sys.stderr)

    try:
        result = analyze(sample_video, student_video,0)

        print(json.dumps(result))
    except Exception as e:
        print(f"Lỗi khi phân tích: {e}", file=sys.stderr)
        sys.exit(1)