import json
import os
from rich import print
from rich.tree import Tree
from rich.console import Console

console = Console()


def build_tree(name, obj, parent):
    if isinstance(obj, dict):
        branch = parent.add(f"[cyan]{name}[/cyan] {{object}}")
        for k, v in obj.items():
            build_tree(k, v, branch)

    elif isinstance(obj, list):
        branch = parent.add(f"[green]{name}[/green] [list] ({len(obj)})")
        if obj:
            build_tree("[0]", obj[0], branch)

    else:
        parent.add(f"{name}: [yellow]{type(obj).__name__}[/yellow]")


def summary(obj):
    stats = {
        "objects": 0,
        "arrays": 0,
        "strings": 0,
        "numbers": 0,
        "bools": 0,
        "nulls": 0,
        "keys": set(),
    }

    def walk(x):
        if isinstance(x, dict):
            stats["objects"] += 1
            for k, v in x.items():
                stats["keys"].add(k)
                walk(v)

        elif isinstance(x, list):
            stats["arrays"] += 1
            for i in x:
                walk(i)

        elif isinstance(x, str):
            stats["strings"] += 1

        elif isinstance(x, bool):
            stats["bools"] += 1

        elif x is None:
            stats["nulls"] += 1

        elif isinstance(x, (int, float)):
            stats["numbers"] += 1

    walk(obj)

    print("\n[bold cyan]SUMMARY[/bold cyan]")
    print(f"Objects : {stats['objects']}")
    print(f"Arrays  : {stats['arrays']}")
    print(f"Strings : {stats['strings']}")
    print(f"Numbers : {stats['numbers']}")
    print(f"Bools   : {stats['bools']}")
    print(f"Nulls   : {stats['nulls']}")
    print(f"Keys    : {len(stats['keys'])}")


def schema(obj):
    if isinstance(obj, dict):
        return {k: schema(v) for k, v in obj.items()}

    if isinstance(obj, list):
        if obj:
            return [schema(obj[0])]
        return []

    return type(obj).__name__


files = [f for f in os.listdir() if f.endswith(".json")]

if not files:
    print("[red]JSON file topilmadi.[/red]")
    exit()

print("\n[bold]JSON Files[/bold]\n")

for i, f in enumerate(files, 1):
    print(f"{i}. {f}")

idx = int(input("\nFile number: ")) - 1

filename = files[idx]

with open(filename, "r", encoding="utf-8") as f:
    data = json.load(f)

print("\n1. Tree")
print("2. Schema")
print("3. Summary")

choice = input("\nChoice: ")

if choice == "1":
    tree = Tree(f"[bold]{filename}[/bold]")
    build_tree("root", data, tree)
    console.print(tree)

elif choice == "2":
    print_json = json.dumps(schema(data), indent=2, ensure_ascii=False)
    print(print_json)

elif choice == "3":
    summary(data)

else:
    print("[red]Invalid choice[/red]")