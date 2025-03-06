import json
import datetime
import pytesseract
import pdf2image
from PIL import Image
import pickle as pkl
import io
from time import strptime
import requests as re
import pypdf
import regex
EXAMS_URL = "https://www.cmu.edu/hub/docs/final-exams.pdf"

try:
    txt_pages = pkl.load(open("parsed_exams.pkl", 'rb'))
except:
    txt_pages = None
if not txt_pages:
    a = re.get(EXAMS_URL)

    img = pdf2image.convert_from_bytes(a.content)

    txt_pages = ""
    for page in img:
        txt_pages += "\n" + pytesseract.image_to_string(page, lang="eng", config='--psm 6')
    pkl.dump(txt_pages, open("parsed_exams.pkl", 'wb'))

with open("raw_ocr.txt", "w") as f:
    f.write(txt_pages)

def detect_parse_state(txt_line):
    if "Teaching Space(s)" in txt_line:
        return "LOCATION"
    if "Delivery Mode" in txt_line:
        return "MODE"
    if "Time (EST USA)" in txt_line:
        return "TIME"
    if "Date" in txt_line:
        return "DATE"
    if "Course Sec Title" in txt_line:
        return "COURSE"
    if "Instructor(s)" in txt_line:
        return "INSTRUCTOR"
    return None

# five numbers, space, possibly a letter and number or letter or number, space, any number of characters
course_regex = r"\d{5} [A-Z0-9]{1,4}.*"

teaching_space_regex = r"(Remote|In Person) (To be assigned after Mini-4 add deadline|Remote|(PTC|AH|AN|BH|PH|BR|CIC|CUC|CFA|CYH|DH|FM|GHC|HOA|HBH|HH|HL|MM|MI|NSH|PC|POS|PCA|REH|SC|EDS|TCS|TEP|WH|WEH|WWG|WF|WQ|2SC|3SC|4SC|CC|UT|FRB|INI|PO|MC|BOS|CLY|DON|FAF|FCL|FIF|FBA|GQ1|GQ2|GQ3|GQ4|GQ5|GQ6|HAM|HEN|HIL|MMA|MCG|MOE|MOR|MUD|NVL|ROF|RES|ROS1|ROS2|ROS3|SCO|SPT|STE|WEL|WOO|SH) (Rangos Hall|[A-Z]{0,3}[0-9]{0,4}([A-Z]{0,1}( Atrium){0,1}))|HLAS|TBA)"


time_regex = r"\d{2}:\d{2}[ap]m - \d{2}:\d{2}[ap]m"

# Monday, May 5, 2025
date_regex = r"(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (April|May) \d{1,2}, \d{4}"

instructor_regex = r"([A-Z]+ [A-Z]+ \([a-z]*\))(, [A-Z]+ [A-Z]+ \(.*\))*$"

regexes = [course_regex, teaching_space_regex, time_regex, date_regex, instructor_regex]

parse_state = None

abcdes = [[], [], [], [], [], []]

cursor_position = 0
while True:
    matches = [regex.finditer(pattern, txt_pages, pos=cursor_position).search() for pattern in regexes]
    if not any(matches):
        break
    # Find first match
    cursor_position, match, which = min([(match.span()[0] , match, i) for i, match in enumerate(matches) if match], key=lambda x: x[0])
    end = min([match.span()[1]] + [m.span()[0] for i, m in enumerate(matches) if i != which and m and m.span()[0] > cursor_position])
    print(cursor_position, end)
    abcdes[which].append(txt_pages[cursor_position:end])
    cursor_position = end
    # print(which, abcdes[which][-1])




courses = abcdes[0]
locations = abcdes[1]
times = abcdes[2]
instructors = abcdes[4]
dates = abcdes[3]

print(len(instructors), len(courses), len(locations), len(times), len(dates))
with open("dates_txt.txt", "w") as f:
    f.write("\n".join(dates))


def convert_time_to_datetime_pair(time):
    """Monday, May 5, 2025 01:00pm - 04:00pm -> (datetime(2025, 5, 5, 13, 0), datetime(2025, 5, 5, 16, 0))"""
    time_split = [x for x in time.split(" ") if x != ""]
    date = time_split [1:4]
    date[0] = strptime(date[0], '%B').tm_mon
    date[1] = int(date[1].replace(",", ""))
    date[2] = int(date[2])

    day = datetime.datetime(date[2], date[0], date[1])

    start_time = strptime(time_split[4], "%I:%M%p")
    end_time = strptime(time_split[6], "%I:%M%p")

    start_datetime = datetime.datetime(day.year, day.month, day.day, start_time.tm_hour, start_time.tm_min)
    end_datetime = datetime.datetime(day.year, day.month, day.day, end_time.tm_hour, end_time.tm_min)

    return [start_datetime.timestamp(), end_datetime.timestamp()]

times = [convert_time_to_datetime_pair(dates[i] + " " + times[i]) for i in range(len(times))]

with open("finals.jsonl", "w") as f:
    for i in range(len(courses)):
        final = {
            "course": regex.sub(r'[^a-zA-Z0-9]', '', " ".join(courses[i].split(" ")[:2])),
            "start_time": times[i][0],
            "end_time": times[i][1],
            "location": locations[i]
        }
        f.write(json.dumps(final) + "\n")