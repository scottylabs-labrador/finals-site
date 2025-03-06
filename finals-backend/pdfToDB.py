import json
import datetime
import io
from time import strptime
import requests as re
import PyPDF2
EXAMS_URL = "https://www.cmu.edu/hub/docs/final-exams.pdf"

a = re.get(EXAMS_URL)

pdf = PyPDF2.PdfReader(io.BytesIO(a.content))
print(dir(pdf))

days_of_the_week = ["Monday,", "Tuesday,", "Wednesday,", "Thursday,", "Friday,", "Saturday,", "Sunday,"]
finals = []

text = ""
for i in range(len(pdf.pages)):
    text += pdf.pages[i].extract_text()

def index_of_ampm(line):
    idxs = []
    for i in range(len(line)):
        if "am" in line[i] or "pm" in line[i]:
            idxs.append(i)
    print(line, idxs)
    return idxs

text = text.split("\n")
for line in text:
    try:
        parsed_line = []
        parsed_line.append(line.split(" ")[0]) # course number 
        parsed_line.append(line.split(" ")[1]) # section 
        beginning_of_day = max([line.split(" ").index(dow) for dow in days_of_the_week if dow in line.split(" ")])
        parsed_line.append(" ".join(line.split(" ")[2:beginning_of_day])) # course name
        end_of_day = max(index_of_ampm(line.split(" ")))
        
        parsed_line.append(" ".join(line.split(" ")[beginning_of_day:end_of_day+1])) # time
        parsed_line.append(" ".join(line.split(" ")[end_of_day+1:])) # location + instructor
        finals.append(parsed_line)
    except:
        # print(line)
        pass

print("~~~~~~~~~~~~~~")


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

for final in finals:
    final[3] = convert_time_to_datetime_pair(final[3])

with open("finals.jsonl", "w") as f:
    for final in finals:
        final = {
            "course_number": final[0],
            "section": final[1],
            "course_name": final[2],
            "time": final[3],
            "location": final[4]
        }
        f.write(json.dumps(final) + "\n")

# Then run: npx convex import --table finals finals-backend/finals.jsonl