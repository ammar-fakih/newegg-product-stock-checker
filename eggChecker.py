from bs4 import BeautifulSoup as soup
from urllib.request import urlopen as uReq
import eel

eel.init('web')
eel.start('main.html', block=False, port=0, size=(765, 800), position=(100,100))


@eel.expose
def addModel(identifier, isModelNum):
    """ Args: identifier= string link to newegg product page or model number of a 
        product on newegg, isModelNum= boolean that indicates if first argument is 
        a model num.
        Returns: A list with a name, stockinfo, and a link or model num.
    """
    print("adding Model")

    # if a modelnum is inputted, return a link
    if isModelNum == True:
        link = findPage(identifier)

        if link == -3:
            return -3

        name = findName(link)

        if name == -6:
            name = "Link"

        stock = updateStock(link)

        return [name, stock, link]
    # if a link is inputted, return a model num
    else:
        model = findModel(identifier)

        if model == -4:
            return -4

        name = findName(identifier)

        if name == -6:
            name = "Link"
        
        stock = updateStock(identifier)

        return [name, stock, model]


def findModel(link):
    """ Arg: string url to a newegg product page.
        Returns model # of product
    """
    try:
        pageHtml = uReq(link).read()
        uReq(link).close()
    except:
        return -4

    pageSoup = soup(pageHtml, "html.parser")

    ths = pageSoup.find_all("th")

    if ths == None:
        return -4

    for th in ths:
        if th.text.strip() == "Model":
            return th.find_parent().find("td").text

    return -4

def findPage(model):
    """ Returns link to newegg page for given model # string """

    # urllib cannot accept a link with spaces
    modelNoSpaces = model.replace(" ", "+")

    link = 'https://www.newegg.com/p/pl?d=' + modelNoSpaces

    # opening up connection, grabbing the page
    try:
        pageHtml = uReq(link).read()
        uReq(link).close()
    except:
        return -3

    # html parsing
    pageSoup = soup(pageHtml, "html.parser")
    # grabs each product
    containers = pageSoup.find_all("div", "item-cell")

    if containers == None:
        return -3

    # iterate through product listings
    for container in containers:
        pageLink = container.find("a", "item-title").get("href")

        pageLink = pageLink.replace(" ", "+")

        uClient = uReq(pageLink)
        pageHtml = uClient.read()
        uClient.close()

        pageSoup = soup(pageHtml, "html.parser")

        tds = pageSoup.find_all("td")

        for td in tds:
            if td.text == model:
                return pageLink
    # return error code if product is not found
    return -3

def findName(link):
    """ Args: a string url to a newegg product page
        Returns a string with the first 5 letters of the item title on the product page.
    """
    if link == {}:
        return -6

    # opening up connection, grabbing the page
    try:
        pageHtml = uReq(link).read()
        uReq(link).close()
    except:
        return -6

    # html parsing
    pageSoup = soup(pageHtml, "html.parser")

    title = pageSoup.find("h1", class_="product-title")

    if title == None:
        return -6

    title = title.text.split(" ")[:5]

    return ' '.join([str(elem) for elem in title])

@eel.expose
def updateStock(link):
    """ Args: a string link to a newegg product page.
        Returns a string with stock info grabbed directly from the page.
    """
    print("Updating stock")

    try:
        pageHtml = uReq(link).read()
        uReq(link).close()
        pageSoup = soup(pageHtml, "html.parser")
    except:
        msg = "link broken/changed. attempting to find link"
        # find link
        return msg

    stock = pageSoup.find("div", "product-inventory").text.strip()

    return stock

# sleeps until a function is called from the js code.
while(True):
    eel.sleep(1.0)