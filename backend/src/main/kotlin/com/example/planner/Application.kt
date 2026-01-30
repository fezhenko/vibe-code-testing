package com.example.planner

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.http.content.defaultResource
import io.ktor.server.http.content.resources
import io.ktor.server.http.content.static
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.path
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.serialization.jackson.jackson
import java.time.Instant

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module).start(wait = true)
}

data class SourceLink(val name: String, val url: String)

data class CountrySeries(
    val currency: String,
    val marketReturns: List<Double>,
    val homeGrowth: List<Double>,
    val mortgageRates: List<Double>,
)

data class MarketData(
    val sources: List<SourceLink>,
    val countries: Map<String, CountrySeries>,
)

data class MedianAssumptions(
    val currency: String,
    val annualMarketReturn: Double,
    val annualHomeGrowth: Double,
    val mortgageRate: Double,
)

data class AssumptionsResponse(
    val generatedAt: String,
    val sources: List<SourceLink>,
    val countries: Map<String, MedianAssumptions>,
)

fun Application.module() {
    install(ContentNegotiation) {
        jackson()
    }

    val mapper = jacksonObjectMapper()
    val dataStream = requireNotNull(this::class.java.classLoader.getResourceAsStream("market-data.json")) {
        "market-data.json missing from resources"
    }
    val rawData: MarketData = mapper.readValue(dataStream)
    val assumptions = rawData.countries.mapValues { (_, series) ->
        MedianAssumptions(
            currency = series.currency,
            annualMarketReturn = median(series.marketReturns),
            annualHomeGrowth = median(series.homeGrowth),
            mortgageRate = median(series.mortgageRates),
        )
    }
    val response = AssumptionsResponse(
        generatedAt = Instant.now().toString(),
        sources = rawData.sources,
        countries = assumptions,
    )

    routing {
        get("/api/assumptions") {
            call.respond(response)
        }

        static("/") {
            resources("public")
            defaultResource("public/index.html")
        }

        get("/{...}") {
            val acceptHeader = call.request.headers[HttpHeaders.Accept]
            if (acceptHeader?.contains(ContentType.Application.Json.toString()) == true) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Not found"))
            } else {
                val index = this::class.java.classLoader.getResource("public/index.html")
                if (index == null) {
                    call.respondText("Frontend not built.")
                } else {
                    call.respondBytes(index.readBytes(), ContentType.Text.Html)
                }
            }
        }
    }
}

fun median(values: List<Double>): Double {
    if (values.isEmpty()) {
        return 0.0
    }
    val sorted = values.sorted()
    val mid = sorted.size / 2
    return if (sorted.size % 2 == 0) {
        (sorted[mid - 1] + sorted[mid]) / 2
    } else {
        sorted[mid]
    }
}
