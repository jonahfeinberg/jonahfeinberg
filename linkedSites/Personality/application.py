from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        name = request.form.get("name")

        scores = {
            "Gryffindor": 0,
            "Hufflepuff": 0,
            "Ravenclaw": 0,
            "Slytherin": 0
        }

        questions = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13"]

        for q in questions:
            answer = request.form.get(q)

            if answer:
                answer = answer.capitalize()
                scores[answer] += 1

        val_q14 = float(request.form.get("q14", 5))

        normalized_q14 = (val_q14 - 1) / 9

        scores["Gryffindor"] += round(normalized_q14)
        scores["Slytherin"] += round(1 - normalized_q14)

        val_q15 = float(request.form.get("q15", 5))

        normalized_q15 = (val_q15 - 1) / 9

        scores["Hufflepuff"] += round(normalized_q15)
        scores["Ravenclaw"] += round(1 - normalized_q15)


        max_score = max(scores.values())
        top_houses = [house for house, score in scores.items() if score == max_score]

        if len(top_houses) == 1:
            house = top_houses[0]
        else:
            house = " or ".join(top_houses)

        return render_template(
            "result.html",
            name=name,
            house=house,
            gryffindor=scores["Gryffindor"],
            hufflepuff=scores["Hufflepuff"],
            ravenclaw=scores["Ravenclaw"],
            slytherin=scores["Slytherin"]
        )

    else:
        return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
